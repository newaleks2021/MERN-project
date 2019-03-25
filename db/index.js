require('dotenv').config({ path: 'variables.env' });
const {NODE_ENV} = process.env;
const config = require('../knexfile.js');

// Set up a Knex instance that we can use to query with
const knex = require('knex')(config[NODE_ENV]);

// Ensure that we're always migrating the latest migration
knex.migrate.latest([config]);

// Wrap bookshelf ORM around Knex connection
const bookshelf = require('bookshelf')(knex);
bookshelf.plugin('virtuals');
bookshelf.plugin('registry');
bookshelf.plugin('pagination');
bookshelf.plugin(require('bookshelf-slug'));

module.exports = bookshelf;
