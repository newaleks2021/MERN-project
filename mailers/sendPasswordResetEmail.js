const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {*} email 
 * @param {*} token 
 * @param {*} host 
 */
const sendPasswordResetEmail = async (id, email, token, host, stakeholderName) => {
    const subject = __('mailers.account.subject', stakeholderName);
    const buttonurl = `${process.env.PROTOCOL}${host}/reset-password/${token}/${id}`;
    const body1 = __('mailers.account.body1');

    const body2 = __('mailers.account.body2');
    
    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        body2: body2,
        stakeholdername: stakeholderName,
        buttonurl,
        buttontext: __('mailers.account.reset')
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID);
};

module.exports = sendPasswordResetEmail;