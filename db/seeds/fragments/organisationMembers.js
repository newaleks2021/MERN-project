const {newDateNow} = require('../../../helpers/dateHelper');
const getRandomInt = require('../../../helpers/getRandomInt');

const createOrganisationMember = (i, stakeholderId, organisationId) => ({
    id: i,
    isAdmin: 1,
    stakeholder_id: stakeholderId,
    organisation_id: organisationId,
    created_at: newDateNow()
});

const generateOrganisationMembers = (count, organisationsCount, stakeholdersCount) => {
    const organisationMembers = [];
    for(let i = 1; i <= count; i++) { 
        organisationMembers.push(createOrganisationMember(
            i, 
            getRandomInt(1, stakeholdersCount),
            getRandomInt(1, organisationsCount),
        ));
    }

    return organisationMembers;
};

module.exports = generateOrganisationMembers;

