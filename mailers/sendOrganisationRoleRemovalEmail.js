const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {*} email 
 * @param {*} token 
 * @param {*} host 
 */
const sendOrganisationRoleRemovalEmail = async (email, host, role, organisation, remover, stakeholderName) => {
    const subject = __('mailers.org-removal.subject', role, organisation);
    const body1 = __('mailers.org-removal.body1', organisation, role);
    
    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        stakeholdername: stakeholderName
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_ID);
};

module.exports = sendOrganisationRoleRemovalEmail;
