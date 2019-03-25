
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
const sendMoveTocInvitationEmail = async (email, stakeholderName, tocName, tocUuid, token, host, invitor, invitorName, options) => {
    const subject = __('mailers.toc-move.subject');
    const buttonurl = `${process.env.PROTOCOL}${host}/move-to-organisation/${token}/${tocUuid}/${invitor}`;

    const body1 = __('mailers.toc-move.body1', stakeholderName, process.env.PROTOCOL, host, invitor, invitorName, process.env.PROTOCOL, host, tocUuid, tocName);
    const body2 = __('mailers.toc-move.body2');

    await sendEmailWithTemplate(email, subject, body1, {
        header: subject,
        body1: body1,
        body2: body2,
        stakeholdername: stakeholderName,
        buttonurl,
        buttontext:__('mailers.toc-move.confirm')
    }, process.env.SENDGRID_INFORMATIONAL_TEMPLATE_WITH_BUTTON_ID);
};

module.exports = sendMoveTocInvitationEmail;