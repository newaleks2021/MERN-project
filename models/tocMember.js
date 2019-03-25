const bookshelf = require('../db');
const Stakeholder = require('./stakeholder');

const TocMember = bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'toc_members',
  hasTimestamps: true,
  hasTimestamps: [
    'created_at', 'updated_at'
  ],
  getStakeholder: async function(id) {
    const stakeholder = await Stakeholder.where({id}).fetch();
    return stakeholder.toJSON();
  }
});

module.exports = bookshelf.model('TocMember', TocMember);