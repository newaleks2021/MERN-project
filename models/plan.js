const bookshelf = require('../db');
const isBlacklisted = require('../helpers/usernameBlacklist');

const Plan = bookshelf.Model.extend({idAttribute: 'id', tableName: 'plans'});

/**
 * @public
 * Checks if username is a duplicate or blacklisted
 * @param {String} [username]
 * @return {String} Flash message if username is not valid
 */
Plan.ensureValidName = async (name) => {
  const isNameBlacklisted = isBlacklisted(name);
  if (isNameBlacklisted) 
    return 'Malicious plan name, please choose something else.';
  
  const existingPlanName = await Plan.where({name}).fetch();
  if (existingPlanName) 
    return 'Plan name is already in use, please choose something else.';
  
  return null;
};

module.exports = bookshelf.model('Plan', Plan);