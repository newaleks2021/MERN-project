const generateStakeholders = require('./fragments/stakeholders');
const generateOrganisations = require('./fragments/organisations');
const generatePlans = require('./fragments/plans');
const generateOrganisationMembers = require('./fragments/organisationMembers');
const generateTocs = require('./fragments/tocs');
const generateTocMembers = require('./fragments/tocMembers');

const {encrypt} = require('../../helpers/hashing');

const rows = {
    stakeholders: 20,
    organisations: 10,
    organisationMembers: 10,
    tocs: 20,
    tocMembers: 10
};

exports.seed = async (knex, Promise) => {
  if(process.env.NODE_ENV == 'development') {
      await knex.raw('SET foreign_key_checks = 0;');
    
      await knex('organisation_members').del();
      await knex.raw('ALTER TABLE organisation_members AUTO_INCREMENT = 0');
      await knex('organisations').del();
      await knex.raw('ALTER TABLE organisations AUTO_INCREMENT = 0');
      await knex('stakeholders').del();
      await knex.raw('ALTER TABLE stakeholders AUTO_INCREMENT = 0');
      await knex('plans').del();
      await knex.raw('ALTER TABLE plans AUTO_INCREMENT = 0');
      await knex('tocs').del();
      await knex.raw('ALTER TABLE tocs AUTO_INCREMENT = 0');
      await knex('toc_members').del();
      await knex.raw('ALTER TABLE toc_members AUTO_INCREMENT = 0');
    
      await knex.raw('SET foreign_key_checks = 0;');
    
      const generatedStakeholders = await generateStakeholders(rows.stakeholders);
      const generatedPlans = generatePlans();
      const generatedOrganisations = generateOrganisations(rows.organisations, generatedPlans.length);
      const generatedOrganisationMembers = generateOrganisationMembers(
        rows.organisationMembers, 
        rows.organisations,
        rows.stakeholders
      );
      const generatedTocs = await generateTocs(rows.tocs, rows.organisations);
      const generatedTocMembers = await generateTocMembers(
        rows.tocMembers, 
        rows.stakeholders, 
        rows.tocs
      );
    
      await knex('plans').insert(generatedPlans);
      await knex('stakeholders').insert(generatedStakeholders);
      await knex('organisations').insert(generatedOrganisations);
      await knex('organisation_members').insert(generatedOrganisationMembers);
      await knex('tocs').insert(generatedTocs);
      await knex('toc_members').insert(generatedTocMembers);

      return knex.raw('SET foreign_key_checks = 1;');  
  } else if (process.env.NODE_ENV == 'production') {
    const hashedSysAdmin = await encrypt(SYS_ADMIN_PASSWORD);
    return Promise.all([
      knex('stakeholders').insert([
        {
          id: i,
          email: process.env.SYS_ADMIN_EMAIL,
          full_name: 'System Admin',
          username: process.env.SYS_ADMIN_USERNAME,
          isActivated: 1,
          isAdmin: 1,
          password_hash: hashedSysAdmin
        }
      ])
    ]);
  }
};