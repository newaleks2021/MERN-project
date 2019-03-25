const sendEmailWithTemplate = require('./sendEmailWithTemplate');

/**
 * @public
 * @param {String} [email] E-mail to send mail to
 * @param {String} [token] Activation token to send in mail
 * @param {String} [host] Current project URL
 */
const sendOrganisationMemberInvitationEmail = async (
    email, memberId, organisationName, stakeholderName, token, host, invitor, options
) => {
    const subject = __('mailers.org-invitation.subject', options.role, organisationName);

    const buttonurl1 = `${process.env.PROTOCOL}${host}/accept-organisation-role/${token}/${memberId}`;
    const buttonurl2 = `${process.env.PROTOCOL}${host}/decline-organisation-role/${token}/${memberId}/${invitor}`;

    const body1 = __('mailers.org-invitation.body1', organisationName, options.role, organisationName);
    const body2 = __('mailers.org-invitation.body2', process.env.PROTOCOL, host, process.env.PROTOCOL, host, invitor);

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        body2: body2,
        stakeholdername: stakeholderName,
        buttonurl1,
        buttonurl2,
        buttontext1: __('mailers.org-invitation.confirm'),
        buttontext2: __('mailers.org-invitation.decline'),
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTONS_ID);
};

module.exports = sendOrganisationMemberInvitationEmail;