const bookshelf = require('../db');
const isBlacklisted = require('../helpers/usernameBlacklist');

const SupportOrganisation = bookshelf.Model.extend({
  initialize: function() {
    this.on('fetched:collection', (models) => {
      models.forEach(model => {
        const specialisation_tags = model.get('specialisation_tags');
        if (specialisation_tags && specialisation_tags.length > 0) 
          model.set({
            specialisation_tags: specialisation_tags.split(',').map(s => s.replace(/"/g, "").trim())
          });

        const countries = model.get('countries');
        if (countries && countries.length > 0) 
          model.set({
            countries: countries.split(',').map(s => s.replace(/"/g, "").trim())
          });
      });
    });
  },
  idAttribute: 'id',
  tableName: 'support_organisations',
  hasTimestamps: true,
  hasTimestamps: ['created_at', 'updated_at']
});

SupportOrganisation.ensureValidName = async (name) => {
  const isNameBlacklisted = isBlacklisted(name);
  if (isNameBlacklisted) 
    return 'Malicious organisation name, please choose something else.';
  
  const existingOrganisationName = await SupportOrganisation.where({name}).fetch();
  if (existingOrganisationName) 
    return 'Organisation name already exists, please choose a different name.';
  
  return null;
};

SupportOrganisation.getNextOrder = async () => {
    const order = await new SupportOrganisation().orderBy('sort_order', 'DESC').fetch();

    if(!order)
    {
        return 1;
    }
    
    return parseInt(order.get("sort_order")) + 1;
};

module.exports = bookshelf.model('SupportOrganisation', SupportOrganisation);