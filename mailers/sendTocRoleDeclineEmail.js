const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {*} email
 * @param {*} token
 * @param {*} host
 */
const sendTocRoleDeclineEmail = async (email, host, role, toc, decliner, stakeholderName) => {
    const subject = `Changeroo | Declined role`;
    const body1 = `
        This is to inform you ${decliner} has declined your invitation to become ${role} of the Theory of Change ${toc}.
        Please contact the person directly, if you think this was done by mistake. 
    `;

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        stakeholdername: stakeholderName
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_ID);
};

module.exports = sendTocRoleDeclineEmail;
