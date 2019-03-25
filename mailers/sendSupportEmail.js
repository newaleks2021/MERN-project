const helper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);
const {newDateNow} = require('../helpers/dateHelper');

/**
 * 
 * @param {*} fromMail 
 * @param {*} subject 
 * @param {*} body 
 * @param {*} substitutions 
 */
const sendSupportEmail = async ({name, email, message}) => {
    const fromMail = new helper.Email(email);
    const toMail = new helper.Email(process.env.SENDGRID_FROM_MAIL);
    const body = __('mailers.support.body', name, email, newDateNow(), message);

    const content = new helper.Content('text/html',body);

    const mail = new helper.Mail(
        fromMail,
        __('mailers.support.subject', name),
        toMail, 
        content
    );

    const request = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });

    return sendgrid.API(request);
};

module.exports = sendSupportEmail;
