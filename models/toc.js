const bookshelf = require('../db');
const TocMember = require('./tocMember');
const Stakeholder = require('./stakeholder');
const {newDateNow} = require('../helpers/dateHelper');
const Organisation = require('./organisation');
const isBlacklisted = require('../helpers/usernameBlacklist');
const {validProtocol, social, lowercase} = require('./validators/index');
const firebase = require('../controllers/firebaseController');
const uuid = require('uuid/v4');

// export const TOC_VISIBILITY_PRIVATE = 0;
// export const TOC_VISIBILITY_PUBLIC = 1;

const Toc = bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'tocs',
  hasTimestamps: true,
  hasTimestamps: [
    'created_at', 'updated_at'
  ],
  getMembers: async function(id) {
    return TocMember.where({toc_id: id}).fetchAll();
  },
  getMembersAsStakeholders: async function(id, StakeholderModel) {
    const membersInstances = await TocMember.where({toc_id: id}).fetchAll();
    const membersJSON = membersInstances.toJSON();
    const members = [];
    await Promise.all(membersJSON.map(async member => {
      const stakeholder = await StakeholderModel.where({id: member.stakeholder_id}).fetch();
      members.push(stakeholder.toJSON());
    }));
    return members;
  },
  getOrganisation: async function(id, OrganisationModel) {
    if (id === undefined){
      return await bookshelf.model('Organisation').where({id : this.get('organisation_id') }).fetch();
    }
    else{
      return OrganisationModel.where({id}).fetch();
    }
  },
  deactivate: async function(toc) {
    const members = await toc.getMembers(toc.get('id'));
    await Promise.all(members.forEach(async member => {
      await member.destroy();
    }));

    await toc.save({
      deactivated_at: newDateNow(),
      isActivated: 0,
      shouldBeDestroyed: 1
    }, {patch: true});
  },
  copy: async function(keepPermissions, stakeholderId)
  {
    const tocUuid = this.get('uuid');
    const newPermissionObject = {};

    newPermissionObject[stakeholderId] = {
      permissions: {
        read: true,
        write: true
      }
    };

    return new Promise(async function(resolve, reject)
    {
      // First fetch all ToCs
      let nestedProjects = {};
      let parentUuid = uuid();
      let parentProject = null;

      await firebase.database().ref(`/projects/${tocUuid}`).once('value').then(function(snapshot) {
        parentProject = snapshot.val();

        if(parentProject !== null && parentProject.data && parentProject.data.blocks)
        {
          Object.keys(parentProject.data.blocks).forEach(function(block_uuid)
          {
            //Check if block has nested projects
            if (parentProject.data.blocks[block_uuid].nested_projects && parentProject.data.blocks[block_uuid].nested_projects.length)
            {
              for(var i = 0; i < parentProject.data.blocks[block_uuid].nested_projects.length; i++)
              {
                const nested_toc_id = parentProject.data.blocks[block_uuid].nested_projects[i];
                nestedProjects[nested_toc_id] = uuid();
                parentProject.data.blocks[block_uuid].nested_projects[i] = nestedProjects[nested_toc_id];
              }
            }
          });

          if(!keepPermissions)
          {
            parentProject.people = newPermissionObject;
          }
        }
      });

      parentProject.uuid = parentUuid;

      let parentError = false;
      await firebase.database().ref(`/projects/${parentUuid}`).set(parentProject, function(error) {
        if(error)
        {
          parentError = true;
        }
      });

      // If parent failed don't copy children
      if(parentError)
      {
        return resolve(null);
      }

      const nestedIds = Object.keys(nestedProjects);
      const childPromises = [];
      for(var i = 0; i < nestedIds.length; i++)
      {
        const nestedId = nestedIds[i];
        const newUuid = nestedProjects[nestedId];

        await firebase.database().ref(`/projects/${nestedId}`).once('value').then(function(snapshot) {
          let childProject = snapshot.val();

          childProject.parent_project_uuid = parentUuid;
          childProject.uuid = newUuid;

          if(!keepPermissions)
          {
            childProject.people = newPermissionObject;
          }

          childPromises.push(new Promise(async function(resolve, reject)
          {
            await firebase.database().ref(`/projects/${newUuid}`).set(childProject, function(error)
            {
              if(error)
              {
                reject();
              }

              resolve();
            });
          }));
        });
      }

      await Promise.all(childPromises).then(function()
      {
        resolve(parentUuid);
      }).catch(function(error)
      {
        console.log(error);
        resolve(null);
      });
    });
  },
  syncToFirebase: async function() {
    let peopleObject = {};
    // Only add user permissions to a toc if the toc is flagged for destroy
    // and activated
    if (this.get('shouldBeDestroyed') === 0 && this.get('isActivated') === 1) {
      let members = await this.getMembers(this.id);
      members.forEach(function(member) {
        //TODO setup correct permissions?
        let memberObject = {
          permissions: {
            read: true,
            write: true
          }
        };
        peopleObject[member.get('stakeholder_id')] = memberObject;
      });
    } else if (this.get('shouldBeDestroyed') === 0 && this.get('isActivated') === 0) {
      await bookshelf.model('TocMember').where({toc_id: this.get('id'), isAdmin: 1}).fetchAll().then(function(toc_members) {
        toc_members.forEach(function(toc_member) {
          let memberObject = {
            permissions: {
              read: true,
              write: false
            }
          };
          peopleObject[toc_member.get('stakeholder_id')] = memberObject;
        });
      });
    }

    // Add organisation information to toc
    let organisation = await this.getOrganisation();
    let organisationObject = {
      id : organisation.get('id'),
      expires_at : organisation.get('subs_exp_date').toISOString()
    };

    // Check if project has nested projects
    let _this = this;

    // Get parent project
    await firebase.database().ref(`/projects/${this.get('uuid')}`).once('value').then(function(snapshot) {
      let project = snapshot.val();
      if (project !== null && project.data && project.data.blocks) {
        // Loop over all blocks
        Object.keys(project.data.blocks).forEach(function(block_uuid) {
          //Check if block has nested projects
          if (project.data.blocks[block_uuid].nested_projects && project.data.blocks[block_uuid].nested_projects.length) {
            // Loop over nested projects
            project.data.blocks[block_uuid].nested_projects.forEach(function(nested_toc_id) {

              // These are the only values that get synced to project children
              let firebase_object_nested_project = {
                is_activated: _this.get('isActivated'),
                visibility: _this.get('visibility'),
                people: peopleObject
              };
              if (_this.get('shouldBeDestroyed')) {
                firebase_object_nested_project.visibility = 0;
              }

              // Update the nested project
              Object.keys(firebase_object_nested_project).forEach(async function(key) {
                await firebase.database().ref(`/projects/${nested_toc_id}/${key}`).set(firebase_object_nested_project[key]);
              });

            });
          }
        });
      }
    });

    let firebaseObject = {
      name: this.get('name'),
      uuid: this.get('uuid'),
      portal_id: this.get('id'),
      created_at: this.get('created_at') ? this.get('created_at').toISOString() : new Date().toISOString(),
      is_activated: this.get('isActivated'),
      should_be_destroyed: this.get('shouldBeDestroyed'),
      visibility: this.get('visibility'),
      people: peopleObject,
      organisation : organisationObject
    };

    if (_this.get('shouldBeDestroyed')) {
      firebaseObject.visibility = 0;
    }

    let promises = [];

    Object.keys(firebaseObject).forEach(function(key) {
      promises.push(firebase.database().ref(`/projects/${firebaseObject.uuid}/${key}`).set(firebaseObject[key]));
    });

    await Promise.all(promises);
  },
  moveToOrganisation: async function(organisation)
  {
    const uuid = this.get('uuid');
    let organisationObject = {
      id: organisation.id,
      expires_at: organisation.subs_exp_date.toISOString()
    };

    // Move parent project to new organisation
    await firebase.database().ref(`/projects/${uuid}/organisation`).set(organisationObject);

    const nestedProjects = [];
    await firebase.database().ref(`/projects/${uuid}`).once('value').then(function(snapshot) {
      const parentProject = snapshot.val();

      if(parentProject !== null && parentProject.data && parentProject.data.blocks)
      {
        Object.keys(parentProject.data.blocks).forEach(function(block_uuid)
        {
          //Check if block has nested projects
          if (parentProject.data.blocks[block_uuid].nested_projects && parentProject.data.blocks[block_uuid].nested_projects.length)
          {
            for(var i = 0; i < parentProject.data.blocks[block_uuid].nested_projects.length; i++)
            {
              const nested_toc_id = parentProject.data.blocks[block_uuid].nested_projects[i];
              nestedProjects.push(nested_toc_id);
            }
          }
        });
      }
    });

    // Move child projects to new organisation
    for(var i = 0; i < nestedProjects.length; i++)
    {
      await this.database().ref(`/projects/${nestedProjects[i]}/organisation`).set(organisationObject);
    }
  },
  deleteFromFirebase: async function() {
    await firebase.database().ref('/projects/' + this.get('uuid')).set(null);
  }
});

Toc.searchables = ['name', 'about', 'website'];

Toc.updateConstraints = {
  regions: {},
  issues: {},
  size_revenue: {},
  facebook: {
    social: {
      platform: 'facebook',
      message: 'is not a valid Facebook url'
    },
    validProtocol: {}
  },
  twitter: {
    social: {
      platform: 'twitter',
      message: 'is not a valid Twitter url'
    },
    validProtocol: {}
  },
  google_plus: {
    social: {
      platform: 'plus.google',
      message: 'is not a valid Google Plus url'
    },
    validProtocol: {}
  },
  linkedin: {
    social: {
      platform: 'linkedin',
      message: 'is not a valid LinkedIn url'
    },
    validProtocol: {}
  },
  instagram: {
    social: {
      platform: 'instagram',
      message: 'is not a valid Instagram url'
    },
    validProtocol: {}
  },
  website: {
    validProtocol: {}
  },
  pinterest: {
    social: {
      platform: 'pinterest',
      message: 'is not a valid Pinterest url'
    },
    validProtocol: {}
  }
};

/**
 * @public
 * Checks if Theory of Change name is a duplicate or blacklisted
 * @param {String} [name]
 * @return {String} Flash message if name is not valid
 */
Toc.ensureValidName = async (name) => {
  const isNameBlacklisted = isBlacklisted(name);
  if (isNameBlacklisted)
    return 'Malicious Theory of Change name, please choose something else.';

  const existingTocName = await Toc.where({name}).fetch();
  if (existingTocName)
    return 'Theory of Change name is already in use, please choose something else.';

  return null;
};

module.exports = bookshelf.model('Toc', Toc);
