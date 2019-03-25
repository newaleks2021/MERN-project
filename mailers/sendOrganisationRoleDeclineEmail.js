const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {*} email
 * @param {*} token
 * @param {*} host
 */
const sendOrganisationRoleDeclineEmail = async (email, host, role, organisation, decliner, stakeholderName) => {
    const subject = __('mailers.org-decline.subject', role, organisation);
    const body1 = __('mailers.org-decline.subject', decliner, role);

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        stakeholdername: stakeholderName
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_ID);
};

module.exports = sendOrganisationRoleDeclineEmail;
