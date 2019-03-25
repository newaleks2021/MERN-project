const faker = require('faker');
const {newDateNow} = require('../../../helpers/dateHelper');
const addWeeks = require('date-fns/add_weeks');
const getRandomInt = require('../../../helpers/getRandomInt');
const slug = require('slug');

const createOrganisation = (i, randomPlan) => ({
    id: i,
    name: faker.lorem.word(),
    address: faker.address.streetAddress(),
    country: faker.address.country(),
    website: faker.internet.url(),
    hasVatNumber: Math.random() >= 0.5,
    isValidVatNumber: false,
    plan_id: randomPlan,
    subs_exp_date: addWeeks(newDateNow(), Math.floor(Math.random() * (5 - 2 + 1) + 2)),
    created_at: newDateNow()
});

const generateOrganisations = (count, plansCount) => {
    const organisations = [];

    for(let i = 1; i <= count; i++) {
        const org = createOrganisation(
            i,
            getRandomInt(1, plansCount)
        );
        org.slug = slug(org.name + ' ' + org.country, {lower: true});
        organisations.push(org);
    }

    return organisations;
};

module.exports = generateOrganisations;