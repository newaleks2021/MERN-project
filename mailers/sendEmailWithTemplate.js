const helper = require('sendgrid').mail;
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

/**
 * @public
 * @param {*} to 
 * @param {*} subject 
 * @param {*} contentString 
 */
const sendEmailWithTemplate = async (to, subject, body, substitutions, template) => {
    const fromMail = new helper.Email(process.env.SENDGRID_NO_REPLY_MAIL, process.env.SENDGRID_SENDER_NAME);
    const toMail = new helper.Email(to);
    const content = new helper.Content('text/html', body);
    const mail = new helper.Mail(fromMail, subject, toMail, content);
    mail.setTemplateId(template);

    Object.keys(substitutions).map(substitution => {
        mail.personalizations[0].addSubstitution(
            new helper.Substitution(`-${substitution}-`, substitutions[substitution])
        );
    });
    
    const request = sendgrid.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON()
    });
    return sendgrid.API(request, function(err, response) {
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
    });
};

module.exports = sendEmailWithTemplate;
