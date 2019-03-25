require('dotenv').config({ path: 'variables.env' });
const {ACTIVATION_TOKEN_LIFETIME} = process.env;
const validate = require('validate.js');
const Stakeholder = require('../../models/stakeholder');
const {generateActivationToken, isTokenLegitAndNotExpired} = require('../../services/tokenService');
const sendAccountValidationEmail = require('../../mailers/sendAccountValidationEmail');
const {newDateNow} = require('../../helpers/dateHelper');
const {isHashMatching, encrypt} = require('../../helpers/hashing');
const mailController = require('../../controllers/mailController');

// Displays the sign-up form for registering a new user
const showRegister = (req, res) => {
    res.render('auth/register', {
        oldInput: req.session.registerFormInput || {},
        title: 'Sign up', 
        csrfToken: req.csrfToken(),
        validations: Stakeholder.initialConstraints
    });
};

/**
 * @public
 * @param {Object} [req]
 * @param {Object} [res]
 * Processes submit of registration of new user. Sends activation link by email.
 */
const registerStakeholder = async(req, res, next) => {
    req.session['registerFormInput'] = req.body;
    const errors = validate(req.body, Stakeholder.initialConstraints);

    if (errors) { 
        req.flash('error', errors);
        return res.redirect('/auth/register');
    }

    const {email, full_name, username, password} = req.body;

    // Ensure valid username and email, return flash if invalid
    const flash = await Stakeholder.ensureValidUsername(username) || await Stakeholder.ensureValidEmail(email);
    if(flash) {
        req.flash('error', flash);
        return res.redirect('/auth/register');
    }
    
    const password_hash = await encrypt(password);
    const newStakeholderId = await Stakeholder.forge({
        email,
        full_name, 
        username,
        password_hash}).save().get('id');
    
    const token = await generateActivationToken(newStakeholderId);
    
    await sendAccountValidationEmail(email, token, req.get('host'), req.body.full_name);
    
    req.flash('success', req.__('flashes.registration.success'));
    return res.redirect('/');
};

/**
 * @public
 * Activates a new stakeholder,
 * or updates a stakeholder's new email
 * as user clicks the link that has sent to them by email (to activate account or confirm their new email address)
 * @param {Object} [req] 
 * @param {Object} [res] 
 * @param {Function} [next]
 */
const activateStakeholder = async(req, res) => {
    if (!req.query.email || !req.query.token) {
        req.flash('error', req.__('flashes.wrong-parameters-token-link'));
        return res.redirect('/auth/resendactivate');
    }

    // Convert boolean from url from string to boolean
    const updateEmail = (req.query.update == 'true');
    if(updateEmail) {
        stakeholder = await Stakeholder.where({new_email: req.query.email}).fetch();
    } else {
        stakeholder = await Stakeholder.where({email: req.query.email}).fetch();
    }

    if (!stakeholder) {
        req.flash('error', req.__('flashes.activation.wrong-email-token-link'));
        return res.redirect('/auth/resendactivate');
    }

    if(!updateEmail && stakeholder.get('isActivated') == 1) {
        req.flash('error', req.__('flashes.activation.already-activated'));
        return res.redirect('/');
    }

    const activation_hash = stakeholder.get('activation_hash');
    if (!activation_hash) {
        req.flash('error', req.__('flashes.activation.token-empty-in-db'));
        return res.redirect('/auth/resendactivate');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(), 
        activation_hash, 
        stakeholder.get('activation_sent_at'),
        ACTIVATION_TOKEN_LIFETIME);

    if (!isLegit) {
        req.flash('error', req.__('flashes.activation.illegitimate-token'));
        return res.redirect('/auth/resendactivate');
    }

    // If this activation is to update a new email
    if(updateEmail) {
        await stakeholder.save({new_email: null, email: req.query.email});
        req.flash('success', req.__('flashes.update.email-updated'));
        return res.redirect('/');
    }

    await stakeholder.save({activated_at: newDateNow(), isActivated: true}, {patch: true});

    await mailController.sendEmail(mailController.emails.uponFreeTrialCreation, stakeholder.get("email"), { 
        stakeholder: stakeholder.toJSON(),
        host: req.get('host')
    });
    
    req.flash('success', req.__('flashes.activation.succesful-activation'));
    return updateEmail ? res.redirect('/auth/login') : res.redirect('/');
};

// Displays the flash message when a de-activated user tries to login, and in the flash is offered the option to resend an email with an activation link
const showResendActivate = (req, res) => {
    res.render('auth/resendActivate', {title: req.__('flashes.activation.resend'), csrfToken: req.csrfToken()});
};

/**
 * @public
 * @param {Object} [req]
 * @param {Object} [res]
 * showResendActivate showed a flash message, and if the link in that message is clicked, the method below resends an email with an activation link  
 */
const resendActivationForStakeholder = async (req, res, next) => {
    if(!req.body.email) {
        req.flash('error', req.__('flashes.missing-email'));
        return res.redirect('/auth/resendactivate');
    }

    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    if (!stakeholder) {
        req.flash('error', req.__('flashes.email-not-found'));
        return res.redirect('/auth/resendactivate');
    }

    const token = await generateActivationToken(stakeholder.get('id'));
    await sendAccountValidationEmail(req.body.email, token, req.get('host'), stakeholder.get('full_name'));

    req.flash('success', req.__('flashes.activation.activation-email-sent'));
    return res.redirect('/auth/login');
};

module.exports = {
    showRegister,
    showResendActivate,
    registerStakeholder,
    activateStakeholder,
    resendActivationForStakeholder
};
