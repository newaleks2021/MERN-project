require('dotenv').config({ path: 'variables.env' });
const Stakeholder = require('../../models/stakeholder');
const {RESET_TOKEN_LIFETIME} = process.env;
const {generatePasswordResetToken, isTokenLegitAndNotExpired} = require('../../services/tokenService');
const sendPasswordResetEmail = require('../../mailers/sendPasswordResetEmail');
const {encrypt} = require('../../helpers/hashing');

/**
 * @public
 * @param {*} req 
 * @param {*} res 
 * For "forgotten password" sends an email to a user with a link to set a new password
 */
const sendResetPassword = async (req, res) => {
    if(!req.body.email) {
        req.flash('error', req.__('flashes.missing-email'));
        return res.redirect('/auth/login');
    }

    const stakeholder = await Stakeholder.where({email: req.body.email}).fetch();
    // If there is no user with this email, the user doesn't have to know.
    if(!stakeholder) {
        req.flash('success', req.__('flashes.password-reset.password-reset-email-sent'));
        return res.redirect('/auth/login');
    }

    if(!stakeholder.get('isActivated')) {
        // Redirect with same get parameters
        req.flash('success', req.__('flashes.auth.not-yet-activated'));
        return res.redirect('/auth/login');
    }
    
    const token = await generatePasswordResetToken(stakeholder.get('id'));
    await sendPasswordResetEmail(stakeholder.get('id'), req.body.email, token, req.get('host'), stakeholder.get('full_name'));

    req.flash('success', req.__('flashes.password-reset.password-reset-email-sent'));
    return res.redirect('/auth/login');
};

// Shows form, after user has clicked link in email, in which user can enter a new password
const showResetPasswordForm = async(req, res) => {
    if (!req.query.email || !req.query.token) {
        req.flash('error', req.__('flashes.wrong-parameters-token-link'));
        return res.redirect('/auth/login');
    }

    const stakeholder = await Stakeholder.where({email: req.query.email}).fetch();
    if (!stakeholder) {
        req.flash('error', req.__('flashes.email-not-found'));
        return res.redirect('/auth/login');
    }

    const reset_hash = stakeholder.get('reset_hash');
    if (!reset_hash) {
        req.flash('error', req.__('flashes.password-reset.token-empty-in-db'));
        return res.redirect('/auth/login');
    }

    const isLegit = await isTokenLegitAndNotExpired(
        req.query.token.trim(), 
        reset_hash, 
        stakeholder.get('reset_sent_at'),
        RESET_TOKEN_LIFETIME);

    if (!isLegit) {
        req.flash('error', req.__('flashes.password-reset.illegitimate-token'));
        return res.redirect('/auth/login');
    }
    
    req.flash('info', req.__('flashes.password-reset.request-to-reset'));
    res.render('auth/reset', {
            title: 'Reset password', 
            params: {
                email: req.query.email, 
                token: req.query.token
            },
            csrfToken: req.csrfToken()
        });
};

// Processes the form to set a new password
const resetPassword = async (req, res) => {
    if(!req.body.email || !req.body.token) {
        req.flash('error', req.__('flashes.password-reset.failed-reset'));
        return res.redirect('/auth/login');
    }

    const {email, token} = req.body;

    if(!req.body.password || !req.body.password_secure) {
        req.flash('error', req.__('flashes.missing-fields'));
        return res.redirect(`${req.originalUrl}/?token=${token}&email=${email}`);
    }

    if(req.body.password !== req.body.password_secure) {
        req.flash('error', req.__('flashes.update.passwords-dont-match'));
        return res.redirect(`${req.originalUrl}/?token=${token}&email=${email}`);
    }    

    const password_hash = await encrypt(req.body.password);

    await Stakeholder.where({email})
        .save({
            password_hash,
            reset_hash: null,
            reset_sent_at: null
        }, {patch: true});
    
    req.flash('success', req.__('flashes.password-reset.successful-reset'));
    return res.redirect('/auth/login');
};

module.exports = {
    sendResetPassword,
    showResetPasswordForm,
    resetPassword
};
