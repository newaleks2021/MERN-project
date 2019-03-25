const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * Send mail to validate account to registered stakeholder,
 * or send a new email to update current email
 * @param {String} [email] E-mail to send mail to
 * @param {String} [token] Activation token to send in mail
 * @param {String} [host] Current project URL
 */
const sendAccountValidationEmail = async (id, email, token, host, stakeholderName, options) => {
    const subject = options && options.update 
        ? __('mailers.activation.activate-email', stakeholderName) 
        : __('mailers.activation.activate-account', stakeholderName);

    const buttonurl = `${process.env.PROTOCOL}${host}/${options && options.update ? 'update' : 'activate' }-stakeholder/${token}/${id}`;
    const body1 = __('mailers.activation.confirm-message');
    const body2 = __('mailers.activation.welcome-message');
    
    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        body2: body2,
        stakeholdername: stakeholderName,
        buttonurl,
        buttontext:__('mailers.activation.confirm-button')
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID);
};

module.exports = sendAccountValidationEmail;