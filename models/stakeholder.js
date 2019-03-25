const bookshelf = require('../db');
const validate = require('validate.js');
const isBlacklisted = require('../helpers/usernameBlacklist');

/* Models */
const UserSetting = require('./userSetting');
const Organisation = require('./organisation');
const OrganisationMember = require('./organisationMember');
const Toc = require('./toc');
const TocMember = require('./tocMember');

const {validProtocol, social, lowercase} = require('./validators/index');
const firebase = require('../controllers/firebaseController');
const app = require('../app');

const Stakeholder = bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'stakeholders',
  hasTimestamps: true,
  hasTimestamps: [
    'created_at', 'updated_at'
  ],
  constructor : function(){
    bookshelf.Model.apply(this, arguments);
    this.on('saving',function(model,attrs,options){
      // If isAdmin attribute changes
      if(attrs.isAdmin !== undefined || model.get('isAdmin')){
          this.syncAdminsToFirebase().catch((err)=>console.log(err));
      }
    });
    
    // Mark all the users toc for update so that cron sync's them to firebase
    this.on('destroying',async function(model, options){
      var tocs = await model.tocs();
      tocs.forEach(function(toc){
        toc.set('needs_to_sync',true).save();
      });
    });
  },
  tocs: async function(){
    const toc_memberships = await TocMember.where({stakeholder_id: this.get('id')}).fetchAll();
    const tocs = [];

    if (toc_memberships) {
      await Promise.all(toc_memberships.map(async membership => {
        const toc = await Toc.where({id: membership.get('toc_id')}).fetch();

        if (toc) 
          tocs.push(toc);
        }
      ));
    }
    return tocs;
  },
  getStakeholderWithRoles: async function() {
    let stakeholder = this.toJSON();

    const tocRolesInstance = await TocMember.where({stakeholder_id: stakeholder.id}).fetchAll();
    const tocRoles = tocRolesInstance.toJSON();

    stakeholder.roles = {};
    await Promise.all(tocRoles.map(async (tocRole) => {
      const tocInstance = await Toc.where({id: tocRole.toc_id}).fetch();
      const toc = tocInstance.toJSON();
      stakeholder.roles[toc.uuid] = {
        isAdmin: tocRole.isAdmin,
        isMember: tocRole.isMember,
        isModerator: tocRole.isModerator
      };
    }));

    /* Retrieve settings for user */
    stakeholder.settings = await this.getSettings();

    return stakeholder;
  },
  getOrganisations: async function(id, isActivated) {
    const raw = isActivated ? "organisations.isActivated = 1 AND organisations.id IN (SELECT organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = ?)" : "organisations.id IN (SELECT organisation_id FROM organisation_members WHERE organisation_members.stakeholder_id = ?)";
    const organisations = await bookshelf.knex("organisations").whereRaw(raw, id);

    return organisations;
  },
  getTocs: async function(id) {
    const memberOfTocs = await TocMember.where({stakeholder_id: id}).fetchAll();
    const tocs = [];

    if (memberOfTocs) {
      await Promise.all(memberOfTocs.map(async member => {
        const toc = await Toc.where({id: member.get('toc_id')}).fetch();

        if (toc) 
          tocs.push(toc.toJSON());
        }
      ));
    }
    return tocs;
  },
  getSettings: async function() {
    let settings = {};

    const user_settings = await UserSetting.where({stakeholder_id: this.get('id')}).fetchAll();

    /* Create object with parsed user settings */
    user_settings.forEach(function(item) {
      settings[item.get('key')] = JSON.parse(item.get('value'));
    });

    return settings;
  },
  setSetting: async function(key, value) {
    const existing_setting = await UserSetting.where({stakeholder_id: this.get('id'), key: key}).fetch();

    if (existing_setting) {
      await existing_setting.save({'value': JSON.stringify(value)});
    } else {
      await UserSetting.forge({
        stakeholder_id: this.get('id'), 
        key: key, 
        value: JSON.stringify(value)
      }).save(null, {method: 'insert'});
    }
  },
  syncAdminsToFirebase: async function(){
    let admin_stakeholders = await Stakeholder.where({isAdmin: 1}).fetchAll();
    let firebaseObject = {};
    
    admin_stakeholders.forEach(function(item){
      firebaseObject[item.id] = { id : item.id };
    });
        
    await firebase.database().ref(`/administrators`).set(firebaseObject);
  }
});

Stakeholder.searchables = ['full_name', 'username', 'email', 'organisation', 'location'];

Stakeholder.initialConstraints = {
  full_name: {
    presence: true,
    length: {
      minimum: 2,
      message: 'must be at least 2 characters'
    }
  },
  username: {
    presence: true,
    length: {
      minimum: 2,
      maximum: 15,
      message: 'must be between 2 and 15 characters, all lower case (a-z)'
    },
    lowercase: {
      message: 'must be lower case characters only'
    },
    format: {
      pattern: "[a-z0-9]+",
      flags: "i",
      message: "can only contain a-z and 0-9"
    }
  },
  password: {
    presence: true,
    length: {
      minimum: 8,
      message: 'must be at least 8 characters'
    }
  },
  email: {
    presence: true,
    email: {
      message: 'is not valid'
    },
    lowercase: {
      message: 'must be lower case characters only'
    }
  }
};

const {full_name} = Stakeholder.initialConstraints;

Stakeholder.mustHaveConstraints = {
  full_name
};

Stakeholder.updateConstraints = {
  facebook: {
    social: {
      platform: 'facebook',
      message: 'is not a valid Facebook url'
    },
    validProtocol: {}
  },
  function: {
    length: {
      minimum: 2,
      maximum: 30,
      message: 'must be between 2 and 30 characters'
    }
  },
  issues: {},
  regions: {},
  favourite_tocs: {},
  favourite_experts: {},
  bio: {
    length: {
      minimum: 2,
      maximum: 600,
      message: 'must be between 2 and 600 characters'
    }
  },
  expertise: {
    length: {
      minimum: 2,
      maximum: 120,
      message: 'must be between 2 and 120 characters'
    }
  },
  organisation: {
    length: {
      minimum: 2,
      maximum: 50,
      message: 'must be between 2 and 50 characters'
    }
  },
  phone: {
    length: {
      minimum: 7,
      maximum: 14
    }
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
 * Checks if username is a duplicate or blacklisted
 * @param {String} [username]
 * @return {String} Flash message if username is not valid
 */
Stakeholder.ensureValidUsername = async (username) => {
  const isUsernameBlacklisted = isBlacklisted(username);
  if (isUsernameBlacklisted) 
    return 'Malicious username, please choose something else.';
  
  const existingStakeholderUsername = await Stakeholder.where({username}).fetch();
  if (existingStakeholderUsername) 
    return 'Username is already in use, please choose something else.';
  
  return null;
};

/**
 * @public
 * Checks if email is a duplicate
 * @param {String} [email]
 * @return {String} Flash message if email is not valid
 */
Stakeholder.ensureValidEmail = async (email) => {
  const existingStakeholder = await Stakeholder.where({email}).fetch();
  if (existingStakeholder) 
    return 'Email is already in use, please choose something else.';
  return null;
};

module.exports = bookshelf.model('Stakeholder', Stakeholder);
