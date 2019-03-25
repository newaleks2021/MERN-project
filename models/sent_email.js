const bookshelf = require('../db');
const SentEmail = bookshelf.Model.extend({idAttribute: 'id', tableName: 'sent_emails'});

module.exports = bookshelf.model('SentEmail', SentEmail);
