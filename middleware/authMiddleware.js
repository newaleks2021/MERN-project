const jwt = require('jsonwebtoken');
const {newDateNow} = require('../helpers/dateHelper');
const {isTokenExpired} = require('../services/tokenService');
const throwAPIError = require('../helpers/throwAPIError');
const Stakeholder = require('../models/stakeholder');
const getIdFromToken = require('../helpers/getIdFromToken');

/**
 * @private
 * @param {*} [token]
 * @param {} [user]
 * TODO: v2Middleware.js has a method with this same name...!? That's not right, I assume?
 * Checks if there's a valid session
 */
const checkSessionToken = async (token) => {
    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.JWT_SECRET);
    } catch(e) {
        return false;
    }
    
    if(!decoded) return false;

    // Convert to milliseconds
    return isTokenExpired((decoded.iat * 1000), process.env.JWT_TOKEN_LIFETIME);
};

// Keeps the session valid if there's a valid session, and creates a session if there's a valid cookie, and removes session if there's an invalid session
const keepLoggedIn = async (req,res,next) => {
    if(!req.session.token || !req.session.user) {
        // If cookie is still valid
        if(req.cookies.token) {
            const id = await getIdFromToken(req.cookies.token);
            const stakeholderInstance = await Stakeholder.where({id}).fetch();
            const stakeholder = stakeholderInstance.toJSON();
            
            req.session.token = req.cookies.token;
            req.session.user = stakeholder;
            res.locals.user = stakeholder;
        } 
    }
    
    if(req.session.token) {
        const isLoggedIn = await checkSessionToken(req.session.token);
        if(!isLoggedIn) {
            req.session.token = null;
            req.session.user = null;
        }
    }

    return next();
};

/**
 * @public
 * @param {Object} [req] 
 * @param {Object} [res] 
 * @param {Function} [next] 
 * Checks if user is logged in and if not redirects to login page
 */
const ensureLoggedIn = async (req, res, next) => {
    if(!req.session.token || !req.session.user) {
        // If cookie is still valid
        if(req.cookies.token) {
            const id = await getIdFromToken(req.cookies.token);
            const stakeholderInstance = await Stakeholder.where({id}).fetch();
            const stakeholder = stakeholderInstance.toJSON();
            
            req.session.token = req.cookies.token;
            req.session.user = stakeholder;
            res.locals.user = stakeholder;
        } else {
            req.session.redirectTo = req.url;
            req.flash('error', req.__('login-and-signup.login-first'));
            return res.redirect('/auth/login');
        }
    }

    const isLoggedIn = await checkSessionToken(req.session.token);
    if(!isLoggedIn) {
        req.session.token = null;
        req.session.user = null;
        req.session.redirectTo = req.url;
        req.flash('error', req.__('middleware.authorisation.expired-session'));
        return res.redirect('/auth/login');
    }

    return next();
};

/**
 * @public
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * Redirects to homepage if user is already logged in
 */
const ensureLoggedOut = (req, res, next) => {
    if(req.session.token || req.session.user) {
        req.flash('error', req.__('login-and-signup.already-logged-in'));
        return res.redirect('/');
    }

    return next();
};

// TODO: This might be a method for the tool / APIController... Check. Make sure not to break anything for the tool.
const ensureAPILoggedIn = async (req, res, next) => {
    if(!req.session.token || !req.session.user) {
        if(req.cookies.token) {
            const id = await getIdFromToken(req.cookies.token);
            const stakeholder = await Stakeholder.where({id}).fetch();
            req.session.token = req.cookies.token;
            req.session.user = stakeholder.toJSON();
        } else {
            const error = throwAPIError(401, req.__('login-and-signup.login-first'));
            return res.json({error});
        }
    }

    if(!req.session.user.isActivated) {
        const error = throwAPIError(401, req.__('flashes.auth.api-not-activated'));
        return res.json({error});
    }

    /*if(!req.headers.authorization) {
        const error = throwAPIError(401, 'Missing token.');
        return res.json({error});
    }

    if(req.headers.authorization != req.session.token) {
        const error = throwAPIError(401, 'Wrong token.');
        return res.json({error});
    }

    const isLoggedIn = await checkSessionToken(req.headers.authorization);
    if(!isLoggedIn) {
        req.session.token = null;
        req.session.user = null;
        const error = throwAPIError(401, 'Your session has expired')
        return res.json({error});
    }*/

    return next();
};

// TODO: This might be a method for the tool / APIController... Check. Make sure not to break anything for the tool.
const ensureAPILoggedOut = (req, res, next) => {
    //TODO: can't login again , check if current user with token?
    if(req.session.user) {
        const error = throwAPIError(401, req.__('login-and-signup.already-logged-in'));
        return res.json({error});
    }

    return next();
};


module.exports = {
    keepLoggedIn,
    ensureLoggedIn, 
    ensureLoggedOut, 
    ensureAPILoggedIn, 
    ensureAPILoggedOut
}; 
