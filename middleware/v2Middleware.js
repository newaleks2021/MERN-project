require('dotenv').config({ path: 'variables.env' });
const jwt = require('jsonwebtoken');
const Stakeholder = require('../models/stakeholder');
const {isHashMatching, encrypt} = require('../helpers/hashing');
const {newDateNow} = require('../helpers/dateHelper');
const firebase = require('../controllers/firebaseController');
const getIdFromToken = require('../helpers/getIdFromToken');
const {isTokenExpired} = require('../services/tokenService');

const refreshToken = async (req, res, next) => {

    const token = req.signedCookies.signed_web_token;

    if(!token) return signout(req, res, next);

    const authenticated = await checkSessionToken(token);

    if(!authenticated) return signout(req, res, next);

    const id = await getIdFromToken(token);

    if(!id) return signout(req, res, next);

    const stakeholder = await Stakeholder.where({ id }).fetch();

    req.session.user = stakeholder.toJSON();

    return next();

};

const signin = async (req, res, next) => {

    const {email, password} = req.params;

    if(!password || !email) {

        if(!req.session.token) return res.json({ error: 'missing fields' });
        
        return refreshToken(req, res, next);

    }

    const stakeholder = await Stakeholder.where({email}).fetch();

    if (!stakeholder) return res.json({ error: 'wrong credentials' });

    const isPasswordMatching = await isHashMatching(password, stakeholder.get('password_hash'));

    if (!isPasswordMatching) return res.json({ error: 'wrong credentials' });

    const isDeactivated = stakeholder.get('deactivated_at');

    const isActivated = stakeholder.get('isActivated');

    if(!isActivated && isDeactivated) return res.json({ error: 'deactived' });

    if (!isActivated) return res.json({ error: 'not yet activated' });

    const id = stakeholder.get('id');

    const token = jwt.sign({id}, process.env.JWT_SECRET, {
        audience: req.get('host'),
        issuer: req.get('host'),
        // expiresIn: JWT_TOKEN_LIFETIME * 1000,
        algorithm: 'HS256'
    });

    if(!req.params.remember || req.params.remember == 'session') {
        res.cookie('signed_web_token', token, {httpOnly: true, signed: true });
    }

    req.session.user = stakeholder;

    req.session.token = token;

    stakeholder.save({
        login_count: stakeholder.get('login_count') + 1,
        last_login_at: newDateNow()
    }, {patch: true}).then((user) => {

        firebase.auth().createCustomToken(id.toString()).then((firebaseToken) => {
    
          //  res.cookie('firebaseToken', firebaseToken);

            next();
    
        }).catch((response) => {
    
            console.log({ error: 'firebase authentication failed' });
    
        });
    

    }).catch((response) => {

        console.log({ error: 'saving stakeholder failed' });

    });

};

const checkSessionToken = async (token) => {

    let decoded;

    try { decoded = await jwt.verify(token, process.env.JWT_SECRET); }

    catch(e) { return false; }
    
    if(!decoded) return false;

    return isTokenExpired((decoded.iat * 1000), process.env.JWT_TOKEN_LIFETIME);

};

const signout = async (req, res, next) => {

    req.session.user = null;
    
    req.session.token = null;

    res.clearCookie('signed_web_token');

    next();

};

module.exports = {
    refreshToken,
    signin,
    signout
}; 
