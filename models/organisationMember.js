const Stakeholder = require('./stakeholder');
const bookshelf = require('../db');
const validate = require('validate.js');
const Organisation = require('./organisation');

const OrganisationMember = bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'organisation_members',
  hasTimestamps: true,
  hasTimestamps: [
    'created_at', 'updated_at'
  ],
  organisations: () => this.belongsToMany(Organisation),
  getStakeholder: async function(id) {
    const stakeholder = await Stakeholder.where({id}).fetch();
    return stakeholder.toJSON();
  }
});

module.exports = bookshelf.model('OrganisationMember', OrganisationMember);