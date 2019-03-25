const bookshelf = require('../db');

const Post = bookshelf.Model.extend({
    idAttribute: 'id',
    tableName: 'wordpress_posts',
    hasTimestamps: true,
    hasTimestamps: [
      'created_at', 'updated_at'
    ],
});

module.exports = bookshelf.model('Post', Post);
