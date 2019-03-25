require('dotenv').config({ path: 'variables.env' });
const validate = require('validate.js');
const jwt = require('jsonwebtoken');
const Stakeholder = require('../../models/stakeholder');
const {isHashMatching, encrypt} = require('../../helpers/hashing');
const {newDateNow} = require('../../helpers/dateHelper');
const throwAPIError = require('../../helpers/throwAPIError');
const firebase = require('../firebaseController');

// Displays the login page/form
const showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        oldInput: req.session.loginFormInput || {}
    });
};

/**
 * @public
 * @param {Object} [req]
 * @param {Object} [res]
 * Processes the login submit form, and logs the user in
 */
const login = async (req, res, next) => {
    req.session['loginFormInput'] = req.body;
    if(!req.body.email || !req.body.password) {
        req.flash('error', req.__('flashes.missing-fields'));
        return res.redirect('/auth/login');
    }

    const {email, password} = req.body;
    const stakeholder = await Stakeholder.where({email}).fetch();

    if (!stakeholder) {        
        req.flash('error', req.__('flashes.auth.wrong-creds'));
        return res.redirect('/auth/login');
    }

    const isPasswordMatching = await isHashMatching(password, stakeholder.get('password_hash'));
    if (!isPasswordMatching) {
        req.flash('error', req.__('flashes.auth.wrong-creds'));
        return res.redirect('/auth/login');
    }

    const isDeactivated = stakeholder.get('deactivated_at');
    const isActivated = stakeholder.get('isActivated');

    if(!isActivated && isDeactivated) {
        req.flash('error', req.__('flashes.auth.de-activated'));
        return res.redirect('/auth/login');
    }

    if (!isActivated) {
        req.flash('error', req.__('flashes.auth.not-yet-activated'));
        return res.redirect('/auth/login');
    }

    const id = stakeholder.get('id');

    const token = jwt.sign({id}, process.env.JWT_SECRET, {
        audience: req.get('host'),
        issuer: req.get('host'),
        // expiresIn: JWT_TOKEN_LIFETIME * 1000,
        algorithm: 'HS256'
    });

    let firebaseToken = null;
    await firebase.auth().createCustomToken(id.toString())
        .then((customToken) => {
            firebaseToken = customToken;
        })
        .catch((response) => {
            const error = throwAPIError(500, req.__('flashes.firebase.authentication-failed'));
            res.status(500);
            return res.json({error});
        });

    res.cookie('firebaseToken', firebaseToken);

    await stakeholder.save({
        login_count: stakeholder.get('login_count') + 1,
        last_login_at: newDateNow()
    }, {patch: true});

    if(req.body.remember_me)
        res.cookie('token', token, {maxAge: process.env.COOKIE_MAX_AGE, httpOnly: true});

    req.session.user = stakeholder;
    req.session.token = token;
    
    req.flash('info', req.__('flashes.auth.welcome', stakeholder.get('full_name')));
    let redirectTo = req.session.redirectTo ? req.session.redirectTo : `/stakeholders/${stakeholder.get('username')}`;
    delete req.session.redirectTo;
    res.redirect(redirectTo);
};

/**
 *
 * @param {*} req
 * @param {*} res
 * Logs user out: deletes session and cookie
 */
const logout = (req, res) => {
    req.session.user = null;
    req.session.token = null;
    res.clearCookie('token');
    req.flash('info', req.__('flashes.auth.successful-log-out'));
    return res.redirect('/');
};

module.exports = {
    showLogin,
    login,
    logout
};
