const bookshelf = require('../db');
const validate = require('validate.js');
const jsVat = require('jsvat');
const isBlacklisted = require('../helpers/usernameBlacklist');
const Stakeholder = require('./stakeholder');
const OrganisationMember = require('./organisationMember');
const Toc = require('./toc');
const {isEUCountry} = require('../helpers/countriesList');
const {validProtocol, social, lowercase} = require('./validators/index');

const Organisation = bookshelf.Model.extend({
  idAttribute: 'id',
  tableName: 'organisations',
  hasTimestamps: true,
  hasTimestamps: [
    'created_at', 'updated_at'
  ],
  constructor : function(){
    bookshelf.Model.apply(this, arguments);
    this.on('updated',async function(model,attrs,options){
      //TODO maybe not update on every change
      let tocs = await this.getTocs();
      await Promise.all(await tocs.forEach(async toc => {
        toc.syncToFirebase();
      }));
    });
  },
  getMembers: async function(id) {
    if (id === undefined){
      return bookshelf.model('OrganisationMember').where({organisation_id : this.get('id')}).fetchAll();
    }
    return OrganisationMember.where({organisation_id: id}).fetchAll();
  },
  getMembersAsStakeholders: async function(id, StakeholderModel) { 
    const membersInstances = await OrganisationMember.where({organisation_id: id}).fetchAll();
    const membersJSON = membersInstances.toJSON();

    const members = [];
    await Promise.all(membersJSON.map(async member => {
      const stakeholder = await StakeholderModel.where({id: member.stakeholder_id}).fetch();
      const stakeholderJSON = stakeholder.toJSON();
      stakeholderJSON.isOrganisationAdmin = member.isAdmin;

      members.push(stakeholderJSON);
    }));

    return members;
  },
  getTocs: async function(id) {
    if (id === undefined){
      return bookshelf.model('Toc').where({organisation_id : this.get('id')}).fetchAll();
    }
    else{
      return Toc.where({organisation_id: id}).fetchAll();
    }
  }
});

Organisation.searchables = ['name', 'address', 'website', 'city'];

Organisation.constraints = {
  name: {
    presence: true,
    length: {
      minimum: 4,
      maximum: 50,
      //TODO: int
      message: 'must be between 2 and 50 characters'
    }
  }
};

Organisation.updateConstraints = {
  city: {},
  country: {},
  address: {
    length: {
      minimum: 2,
      message: 'must be at least 4 characters'
    }
  },
  website: {
    validProtocol: {}
  }
};

Organisation.initialPremiumConstraints = {
  name: {
    presence: true,
    length: {
      minimum: 4,
      maximum: 50,
      message: 'Organisation must be at least 2 characters'
    }
  },
  address: {
    presence: true,
    length: {
      minimum: 2,
      message: 'must be at least 4 characters'
    }
  },
  country: {
    presence: true
  }
};

/**
 * @public
 * Checks if username is a duplicate or blacklisted
 * @param {String} [username]
 * @return {String} Flash message if username is not valid
 */
Organisation.ensureValidName = async (name) => {
  const isNameBlacklisted = isBlacklisted(name);
  if (isNameBlacklisted) 
    return 'Malicious organisation name, please choose something else.';
  
  const existingOrganisationName = await Organisation.where({name}).fetch();
  if (existingOrganisationName) 
    return 'Organisation name already exists, please choose a different name.';
  
  return null;
};

/**
 * @public
 * Makes sure VAT number is valid
 */
Organisation.ensureValidVatNumber = async (countryCode, vatNumber) => {
  if (!isEUCountry(countryCode)) 
    return 'You are not an EU country.';
  const isValid = await jsVat.checkVAT(`${countryCode}${vatNumber}`);
  if (!isValid) 
    return 'Vat number is not valid.';
  if (isValid && !isValid.isValid) 
    return 'Vat number is invalid, please check your country.';

  return null;
};

module.exports = bookshelf.model('Organisation', Organisation);