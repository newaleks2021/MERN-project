const bookshelf = require('../db');

const UserSetting = bookshelf.Model.extend({idAttribute: 'id', tableName: 'user_settings'});

module.exports = bookshelf.model('UserSetting', UserSetting);