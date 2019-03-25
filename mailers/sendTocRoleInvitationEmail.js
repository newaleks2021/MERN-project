
const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 *
 * @param {*} email
 * @param {*} memberId
 * @param {*} tocName
 * @param {*} token
 * @param {*} host
 * @param {*} options
 */
const sendTocRoleInvitationEmail = async (
    email, memberId, tocName, token, host, stakeholderName, invitor, options
) => {
    const subject = __('mailers.toc-invitation.subject', options.role, tocName);

    const buttonurl1 = `${process.env.PROTOCOL}${host}/accept-toc-role/${token}/${memberId}/${options.role}`;
    const buttonurl2 = `${process.env.PROTOCOL}${host}/decline-toc-role/${token}/${memberId}/${options.role}/${invitor}`;

    const body1 = __('mailers.toc-invitation.body1', tocName, options.role, options.role, tocName);
    const body2 = __('mailers.toc-invitation.body2', process.env.PROTOCOL, host, process.env.PROTOCOL, host, invitor);

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        body2: body2,
        stakeholdername: stakeholderName,
        buttonurl1,
        buttonurl2,
        buttontext1: `Accept role as ${options.role}`,
        buttontext2: `Decline`
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTONS_ID);
};

module.exports = sendTocRoleInvitationEmail;
