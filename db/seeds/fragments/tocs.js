const faker = require('faker');
const {newDateNow} = require('../../../helpers/dateHelper');
const getRandomInt = require('../../../helpers/getRandomInt');
const uuid = require('uuid');

const createToc = (i, organisationId) => ({
    id: i,
    uuid: uuid(),
    name: faker.name.findName(),
    website: faker.internet.url(),
    facebook: faker.internet.url(),
    google_plus: faker.internet.url(),
    instagram: faker.internet.url(),
    linkedin: faker.internet.url(),
    pinterest: faker.internet.url(),
    twitter: faker.internet.url(),
    organisation_id: organisationId
});

const generateTocs = async (count, organisationCount) => {
    const tocs = [];

    for(let i = 1; i <= count; i++) {
        tocs.push(createToc(
            i,
            getRandomInt(1, organisationCount)
        ));
    }

    return tocs;
};

module.exports = generateTocs;