const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {*} email 
 * @param {*} token 
 * @param {*} host 
 */
const sendTocRoleRemovalEmail = async (email, host, role, toc, remover, stakeholderName) => {
    const subject = __('mailers.toc-removal.subject', role, toc);
    const body1 = __('mailers.toc-removal.body1', toc, role);

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        stakeholdername: stakeholderName
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_ID);
};

module.exports = sendTocRoleRemovalEmail;