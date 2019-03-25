// This is the API Controller for the tool / web app

const docx = require('docx');
const stream = require('stream');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const spawn = require('child_process').spawnSync;
const commandExists = require('command-exists').sync;
const fs = require('fs');
const cheerio = require('cheerio');
const toPdf = require("office-to-pdf");

/* Models */
const Stakeholder = require('../models/stakeholder');
const Organisation = require('../models/organisation');

/* Helpers */
const {isHashMatching, encrypt} = require('../helpers/hashing');
const {newDateNow} = require('../helpers/dateHelper');
const throwAPIError = require('../helpers/throwAPIError');
const getIdFromToken = require('../helpers/getIdFromToken');

const serviceAccount = require('../serviceAccountKey.json');
const firebaseAdmin = require('./firebaseController');
const firebase = require('./firebaseController');
const { createDOCX } = require('../helpers/tocExport');

/**
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  if (!req.body.email || !req.body.password) {
    const error = throwAPIError(422, 'Please fill in all the fields.');
    res.status(422);
    return res.json({error});
  }

  const {email, password} = req.body;
  const stakeholder = await Stakeholder.where({email}).fetch();

  if (!stakeholder) {
    const error = throwAPIError(422, 'Authentication failed, wrong combination of email address/password.');
    res.status(422);
    return res.json({error});
  }

  const isPasswordMatching = await isHashMatching(password, stakeholder.get('password_hash'));
  if (!isPasswordMatching) {
    const error = throwAPIError(422, 'Authentication failed, wrong combination of email address/password.');
    res.status(422);
    return res.json({error});
  }

  const isActivated = stakeholder.get('isActivated');
  if (!isActivated) {
    const error = throwAPIError(422, 'Authentication failed, your account is not active yet.');
    res.status(422);
    return res.json({error});
  }

  const id = stakeholder.get('id');
  const token = jwt.sign({
    id
  }, process.env.JWT_SECRET, {
    audience: req.get('host'),
    issuer: req.get('host'),
    algorithm: 'HS256'
  });

  let firebaseToken = null;
  await firebaseAdmin.auth().createCustomToken(id.toString()).then((customToken) => {
    firebaseToken = customToken;
  }).catch((response) => {
    const error = throwAPIError(500, 'Firebase authentication failed.');
    res.status(500);
    return res.json({error});
  });

  res.cookie('firebaseToken', firebaseToken);

  await stakeholder.save({
    login_count: stakeholder.get('login_count') + 1,
    last_login_at: newDateNow()
  }, {patch: true});

  if (req.body.remember_me)
    res.cookie('token', token, {maxAge: process.env.COOKIE_MAX_AGE});
  req.session.user = stakeholder;
  req.session.token = token;

  const stakeholderData = await stakeholder.getStakeholderWithRoles();
  delete stakeholderData.password_hash;
  delete stakeholderData.activation_hash;
  delete stakeholderData.activation_sent_at;

  return res.json({token, firebaseToken, stakeholder: stakeholderData});
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const logout = (req, res) => {
  req.session.user = null;
  req.session.token = null;
  res.clearCookie('token');

  res.setHeader('Content-Type', 'application/json');

  return res.status(200).send(JSON.stringify({
    message: "Succesfully logged out user"
  }));
};

const checkSession = async (req, res) => {
  if (!req.session.token || !req.session.user) {
    if (req.cookies.token) {
      const id = await getIdFromToken(req.cookies.token);
      const stakeholder = await Stakeholder.where({id}).fetch();
      req.session.token = req.cookies.token;
      req.session.user = stakeholder.toJSON();
    } else {
      const error = throwAPIError(401, 'Not logged in');
      return res.json({error});
    }
  }

  const user = req.session.user;
  const email = user.email;
  const stakeholder = await Stakeholder.where({email}).fetch();
  const id = stakeholder.get('id');

  let firebaseToken = null;
  await firebaseAdmin.auth().createCustomToken(id.toString()).then((customToken) => {
    firebaseToken = customToken;
  }).catch((response) => {
    const error = throwAPIError(500, 'Firebase authentication failed.');
    res.status(500);
    return res.json({error});
  });

  const stakeholderData = await stakeholder.getStakeholderWithRoles();
  delete stakeholderData.password_hash;
  delete stakeholderData.activation_hash;
  delete stakeholderData.activation_sent_at;

  return res.json({firebaseToken, stakeholder: stakeholderData});
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const upload = async (req, res) => {
  if (!req.fileId || !req.body.file || !req.filePath) {
    const error = throwAPIError(500, 'Something went wrong during your upload, please try again.');
    res.status(500);
    return res.json({error});
  }

  return res.json({file_id: req.fileId, file_name: req.body.file, file_path: req.filePath});
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const addNestedToc = async (req, res) => {
  if (!req.body.parent_project_uuid || !req.body.name || !req.body.block_uuid) {
    const error = throwAPIError(400, 'Input error');
    res.status(400);
    return res.json({error});
  }

  let parent_project_uuid = String(req.body.parent_project_uuid);
  let child_project_name = String(req.body.name);
  let parent_block_uuid = String(req.body.block_uuid);

  let child_project_uuid = uuid();

  let parent_project = await firebaseAdmin.database().ref(`projects/${parent_project_uuid}`).once('value').then(function(snapshot) {
    return snapshot.val();
  });

  // Throw error if project doesn't exist
  if (parent_project === null) {
    const error = throwAPIError(400, 'Parent project not found');
    res.status(400);
    return res.json({error});
  }

  // Does user have write permission?
  let has_permission_to_write = false;
  if(parent_project.people && parent_project.people[req.session.user.id] && parent_project.people[req.session.user.id].permissions.write === true){
    has_permission_to_write = true;
  }
  // Or is the user a sysadmin
  else if (req.session.user.isAdmin == 1) {
    has_permission_to_write = true;
  }

  // Only continue if user has permission for project
  if (has_permission_to_write) {
    let parent_block = parent_project.data.blocks[parent_block_uuid];

    // Throw error if parent block doesn't exist
    if (!parent_block) {
      const error = throwAPIError(400, 'Parent block not found');
      res.status(400);
      return res.json({error});
    }

    /* Create project and save to firebase */
    let child_project = Object.assign({}, parent_project);
    delete child_project.portal_id,
    child_project.created_at = new Date().toISOString();
    child_project.data = {};
    child_project.name = child_project_name;
    child_project.uuid = child_project_uuid;
    child_project.parent_block_uuid = parent_block.uuid;
    child_project.parent_project_uuid = parent_project_uuid;
    await firebaseAdmin.database().ref('/projects/' + child_project.uuid).set(child_project);

    /* Update parent project */
    if (!parent_block.nested_projects) {
      parent_block.nested_projects = [];
    }
    parent_block.nested_projects.push(child_project.uuid);
    parent_block.nested_projects = parent_block.nested_projects.filter(function(item, pos) {
      return parent_block.nested_projects.indexOf(item) == pos;
    });

    // Add nested project to parent block
    await firebaseAdmin.database().ref(`projects/${parent_project_uuid}/data/blocks/${parent_block_uuid}`).update({nested_projects: parent_block.nested_projects});

    return res.json(child_project.uuid);
  } else {
    // Throw error if logged in user doesn't have permissions for project
    const error = throwAPIError(403, 'No permissions for project');
    res.status(403);
    return res.json({error});
  }
};

/**
  *
  * @param {*} req
  * @param {*} res
  */
const deleteNestedToc = async (req, res) => {
  if(!req.body.parent_toc_uuid || !req.body.parent_block_uuid || !req.body.toc_to_delete_uuid){
    return res.status(400).json(throwAPIError(400, 'Input error'));
  }

  let toc_to_delete_uuid = String(req.body.toc_to_delete_uuid);
  let parent_toc_uuid = String(req.body.parent_toc_uuid);
  let parent_block_uuid = String(req.body.parent_block_uuid);

  let parent_toc = await firebaseAdmin.database().ref(`projects/${parent_toc_uuid}`).once('value').then(function(snapshot) {
    return snapshot.val();
  });


  // Does user have write permission?
  let has_permission_to_write = false;
  if(parent_toc.people[req.session.user.id] && parent_toc.people[req.session.user.id].permissions.write === true){
    has_permission_to_write = true;
  }
  // Or is the user a sysadmin
  else if (req.session.user.isAdmin == 1) {
    has_permission_to_write = true;
  }

  // Only continue if user has permission for project
  if (has_permission_to_write) {
    let toc_to_delete = await firebaseAdmin.database().ref(`projects/${toc_to_delete_uuid}`).once('value').then(function(snapshot) {
      return snapshot.val();
    });

    if(!toc_to_delete){
      return res.status(400).json(throwAPIError(400, 'Project not found'));
    }

    // Prevent users from deleting tocs outside of their project
    if(toc_to_delete.parent_project_uuid === parent_toc_uuid){

      // Delete toc
      await firebaseAdmin.database().ref('/projects/' + toc_to_delete_uuid).set(null).then(async function(){

        // Check if block exists
        if(parent_toc.data.blocks[parent_block_uuid]){

          // Create new array without the deleted project
          let new_nested_tocs_array = parent_toc.data.blocks[parent_block_uuid].nested_projects.filter(function(item){ return item !== toc_to_delete_uuid});

          // Save new array to parent project
          await firebaseAdmin.database().ref(`/projects/${parent_toc_uuid}/data/blocks/${parent_block_uuid}/nested_projects`).set(new_nested_tocs_array).then(function(){
            res.json({
              deleted_nested_toc : toc_to_delete_uuid
            });
          });
        }
      });
    }
    else {
      return res.status(400).json(throwAPIError(400, 'Project is not a child'));
    }
  }
  else{
    // Throw error if logged in user doesn't have permissions for parent project
    return res.status(403).json(throwAPIError(403, 'No permissions for project'));
  }
};

/**
  *
  * @param {*} req
  * @param {*} res
  */
const deleteNestedTocsFromBlock = async (req, res) => {
  if (!req.body.project_uuid || !req.body.block_uuid) {
    const error = throwAPIError(400, 'Input error');
    res.status(400);
    return res.json({error});
  }

  let project_uuid = String(req.body.project_uuid);
  let block_uuid = String(req.body.block_uuid);

  let parent_project = await firebaseAdmin.database().ref(`projects/${project_uuid}`).once('value').then(function(snapshot) {
    return snapshot.val();
  });

  let has_permission_to_write = false;
  if(parent_project.people[req.session.user.id] && parent_project.people[req.session.user.id].permissions.write === true){
    has_permission_to_write = true;
  }
  // Or is the user a sysadmin
  else if (req.session.user.isAdmin == 1) {
    has_permission_to_write = true;
  }

  // Only continue if user has permission for project
  if (has_permission_to_write) {

    let block;
    if (parent_project.data && parent_project.data.blocks) {
      block = parent_project.data.blocks[block_uuid];
    }

    // Throw error if block doesn't exist
    if (!block) {
      const error = throwAPIError(400, 'Block or project not found');
      res.status(400);
      return res.json({error});
    }

    if (block.nested_projects) {
      block.nested_projects.forEach(async function(nested_project_uuid) {
        let nested_toc = await firebaseAdmin.database().ref(`projects/${nested_project_uuid}`).once('value').then(function(snapshot) {
          return snapshot.val();
        });

        // Prevent users from deleting tocs outside of their project
        if(nested_toc.parent_project_uuid === parent_project.uuid){
           await firebaseAdmin.database().ref('/projects/' + nested_project_uuid).set(null);
        }
      });

      res.json({
        deleted_projects : block.nested_projects
      });
      // TODO maybe delete referenced keys from block
    }
    else {
      const error = throwAPIError(400, 'Block does not have any nested_projects');
      res.status(400);
      return res.json({error});
    }
  }
  else {
    // Throw error if logged in user doesn't have permissions for project
    const error = throwAPIError(403, 'No permissions for project');
    res.status(403);
    return res.json({error});
  }
};

/**
  *
  * @param {*} req
  * @param {*} res
  */
const setUserSetting = async (req,res) => {
  let allowed_keys = ['hide_tour_modal','hide_vision_of_success'];

  /* Check for input */
  if (!req.body.key || req.body.value === undefined) {
    const error = throwAPIError(400, 'Input error');
    res.status(400);
    return res.json({error});
  }

  /* Check if user can modify setting */
  if (allowed_keys.indexOf(req.body.key) === -1){
    const error = throwAPIError(403, 'No permissions for key');
    res.status(400);
    return res.json({error});
  }

  /* Get user and set setting */
  const stakeholder = await Stakeholder.where({id : req.session.user.id }).fetch();
  await stakeholder.setSetting(req.body.key,req.body.value);

  /* Return all settings */
  return res.json(await stakeholder.getSettings());
};


const getUserOrganisations = async (req,res) => {
  const stakeholder = await Stakeholder.where({id : req.session.user.id }).fetch();
  let organisations = await stakeholder.getOrganisations(req.session.user.id,true);
  organisations = organisations.map(function(organisation){
    delete organisation.id;
    return organisation;
  });

  return res.json(organisations);
};

const getOrganisationTocs = async (req,res) => {
  let organisation = await Organisation.where({slug : req.params.slug }).fetch();
  let members = await organisation.getMembers();

  let has_permission = false;

  members.forEach(function(member){
    if (member.get('stakeholder_id') == req.session.user.id && member.get('isAdmin')){
      has_permission = true;
    }
  });

  if(!has_permission){
    const error = throwAPIError(403, 'No permissions for this organisation');
    res.status(403);
    return res.json({error});
  }

  let tocs = await organisation.getTocs();
  tocs = tocs.filter(function(toc){
    if (toc.get('shouldBeDestroyed')){
      return false;
    }
    return true;
  });

  tocs = tocs.map(function (toc){
    let toc_json = toc.toJSON();
    delete toc_json.id;
    delete toc_json.organisation_id;
    delete toc_json.shouldBeDestroyed;
    delete toc_json.needs_to_sync;
    delete toc_json.movement_username;
    delete toc_json.movement_hash;
    delete toc_json.movement_sent_at;
    toc_json['app_url'] = `${process.env.WEB_APP_URL}/project/${toc_json.uuid}`;
    toc_json['portal_url'] = `https://${req.headers.host}/tocs/${toc_json.uuid}`;
    return toc_json;
  });

  return res.json(tocs);
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const exportToc = async (req, res) => {
  const required_keys = [
    'project_uuid',
    'format',
    'svg',
    'include_narratives',
    'include_content_pages',
  ];

  required_keys.forEach((required_key) => {
    if (typeof req.body[required_key] === undefined) {
      const error = throwAPIError(422, `Required key "${required_key}" was not specified.`);
      res.status(422);
      return res.json({ error });
    }
  });

  firebase.database().ref(`/projects/${req.body.project_uuid}`).once('value', async function(snapshot) {
    const project = snapshot.val();
    if (project) {
      switch (req.body.format.toLowerCase()) {
        case 'pdf':
        case 'docx-2007':
        case 'docx': {
          const doc = await createDOCX(
            req.body.format,
            project,
            req.body.svg,
            req.body.include_narratives,
            req.body.include_content_pages,
          );

          const packer = new docx.Packer();

          const readStream = new stream.PassThrough();
          const docBuffer = await packer.toBuffer(doc);

          if (req.body.format === 'pdf') {
            // Convert it to a PDF and append it to the readStream.
            const pdfBuffer = await toPdf(docBuffer);
            readStream.end(pdfBuffer);
          } else {
            // Just append the regular docBuffer.
            readStream.end(docBuffer);
          }

          res.setHeader('Content-type', 'application/octet-stream');
          readStream.pipe(res);
          return res;
          break;
        }
      }
    }
  });
};


/**
 * exportTocDiagram
 *
 * @param {*} req
 * @param {*} res
 */
const exportTocDiagram = async (req, res) => {
  const required_keys = ['format', 'svg'];

  required_keys.forEach((required_key) => {
    if (typeof req.body[required_key] === undefined) {
      const error = throwAPIError(422, `Required key "${required_key}" was not specified.`);
      res.status(422);
      return res.json({ error });
    }
  });

  const { svg, format } = req.body;

  const allowed_formats = ['jpeg', 'png'];
  if (allowed_formats.indexOf(format) === -1) {
    const error = throwAPIError(422, `Unsupported format was specified: ${format}.`);
    res.status(422);
    return res.json({ error });
  }

  const id = uuid.v4();
  const filepath = `/tmp/${id}.svg`;
  const svgData = svg.replace(/^data:image\/.*base64,/, "");
  const svgBuffer = new Buffer(svgData, 'base64');

  fs.writeFileSync(filepath, svgBuffer);

  const newFilePath = filepath.replace(/\.svg$/, `.${format}`);

  // Use headless mode of Chromium to:
  // - open the svg in a browser
  // - take a screenshot of the page
  // - write the file under a specified filename
  if (commandExists('google-chrome')) {
    const $ = cheerio.load(svgBuffer);
    const width = $('svg').attr('width');
    const height = $('svg').attr('height');
    const newFilePath = filepath.replace(/\.svg$/, '.png');
    spawn('google-chrome', [
      '--headless',
      '--disable-gpu',
      `--screenshot=${newFilePath}`,
      `--window-size=${width},${height}`,
      '--no-sandbox',
      '--hide-scrollbars',
      `file://${filepath}`,
    ]);
  } else {
    console.log('[error] Unknown command: google-chrome.');
  }

  const formats_extension = {
    'pdf': 'pdf',
    'docx': 'docx',
    'docx-2007': 'docx',
  };

  // We just add a filename here with the format: `${id}.${format}` but we do
  // generate the actual filename that gets shown to the user client-side.
  res.download(newFilePath, `${id}.${formats_extension[format]}`, () => {
    fs.unlink(newFilePath);
  });

  fs.unlink(filepath);
  return res;
};

module.exports = {
  login,
  logout,
  checkSession,
  upload,
  exportToc,
  exportTocDiagram,
  addNestedToc,
  deleteNestedToc,
  deleteNestedTocsFromBlock,
  setUserSetting,
  getUserOrganisations,
  getOrganisationTocs
};
