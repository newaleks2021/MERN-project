const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {newDateNow} = require('../helpers/dateHelper');
const {getMonth, getYear} = require('date-fns');
const uuid = require('uuid');
const jimp = require('jimp');
const mkdirp = require('mkdirp');
const throwAPIError = require('../helpers/throwAPIError');
const sharp = require('sharp');

const photoFilter = (req, file, next) => {
  // TODO: security for executable mimi types
  const isPhoto = file.mimetype.startsWith('image');

  if (isPhoto) {
    next(null, true);
  } else {
    next(new Error('That filetype is not allowed!'), false);
  }
};

/**
 * Created new year and month based dirs and writes file to these dirs
 * @param {*} file
 * @returns {String} Full file path
 */
const getUploadPath = async () => {
  const date = newDateNow();

  const yearPath = path.resolve(`./public/uploads/${getYear(date)}`);
  if (!fs.existsSync(yearPath)) {
    fs.mkdirSync(yearPath);
  }

  const monthPath = `${yearPath}/${getMonth(date)}`;
  if (!fs.existsSync(monthPath)) {
    fs.mkdirSync(monthPath);
  }
  
  return `${getYear(date)}/${getMonth(date)}/`;
};
 
const write = async (file, name) => {
  const date = newDateNow();
  const folder = path.resolve(`./public/uploads/${getYear(date)}/${getMonth(date)}`);

  mkdirp.sync(folder);
  
  let result = await file.write(`${folder}/${name}`);
  return `${getYear(date)}/${getMonth(date)}/${name}`;
};

/**
 *
 */
const filterAvatar = multer({storage: multer.memoryStorage(), filteFilter: photoFilter}).single('avatar');

const filterLogo = multer({storage: multer.memoryStorage(), filteFilter: photoFilter}).single('logo');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const resizeAndWriteAvatar = async (req, res, next) => {
  if (!req.file) 
    return next();
  
  const extension = req.file.mimetype.split('/')[1];
  const name = `${uuid.v4()}.${extension}`;

  if (extension == 'gif') {
    await sharp(req.file.buffer)
      .resize(parseInt(process.env.RESIZE_AVATAR_SIZE))
      .toFile(await path.resolve(`./public/uploads/${await getUploadPath()}${name}`));
    req.body.avatar = `${await getUploadPath()}${name}`;
  } else {
    let avatar = await jimp.read(req.file.buffer);
    await avatar.resize(parseInt(process.env.RESIZE_AVATAR_SIZE), jimp.AUTO);
    req.body.avatar = await write(avatar, name);
  }

  next();
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const resizeAndWriteLogo = async (req, res, next) => {
  if (!req.file) 
    return next();
  
  const extension = req.file.mimetype.split('/')[1];
  const name = `${uuid.v4()}.${extension}`;

  let logo;
  if (extension == 'gif') {
    req.flash('error', 'That filetype is not supported!');
    return res.redirect('/');
  } else {
    logo = await jimp.read(req.file.buffer);
    await logo.resize(parseInt(process.env.RESIZE_AVATAR_SIZE), jimp.AUTO);
  }

  req.body.logo = await write(logo, name);

  next();
};

/**
 *
 */
const filterFile = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image');
    const isVideo = file.mimetype.startsWith('video');
    if (isPhoto || isVideo) {
      next(null, true);
    } else {
      next(new Error('That filetype is not allowed!'), false);
    }
  }
}).single('file');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const resizeAndWriteFile = async (req, res, next) => {
  if (!req.file) 
    return next();
  
  const extension = req.file.mimetype.split('/')[1];
  const id = uuid.v4();
  const name = `${id}.${extension}`;

  if (req.file.mimetype === "image/gif" && extension === "gif") {
    const date = newDateNow();
    const yearPath = path.resolve(`./public/uploads/${getYear(date)}`);
    if (!fs.existsSync(yearPath)) {
      fs.mkdirSync(yearPath);
    }
    const monthPath = `${yearPath}/${getMonth(date)}`;
    if (!fs.existsSync(monthPath)) {
      fs.mkdirSync(monthPath);
    }

    const file = {
      write: function() {}
    };

    const filePath = `./public/uploads/${getYear(date)}/${getMonth(date)}/${name}`;
    req.body.file = `${getYear(date)}/${getMonth(date)}/${name}`;
    req.fileId = id;
    req.filePath = filePath;

    fs.writeFileSync(filePath, req.file.buffer, 'utf8', function(err) {});

    return next();
  }

  const file = await jimp.read(req.file.buffer);
  const filePath = await write(file, name);

  req.body.file = filePath;
  req.fileId = id;
  req.filePath = `./public/uploads/${filePath}`;

  next();
};

module.exports = {
  filterAvatar,
  resizeAndWriteAvatar,
  filterFile,
  resizeAndWriteFile,
  filterLogo,
  resizeAndWriteLogo
};
