const faker = require('faker');
const {newDateNow} = require('../../../helpers/dateHelper');
const getRandomInt = require('../../../helpers/getRandomInt');

const createTocMember = (i, stakeholderId, tocId) => ({
    id: i,
    isMember: 1,
    stakeholder_id: stakeholderId,
    toc_id: tocId,
});

const generateTocMembers = async (count, stakeholdersCount, tocsCount) => {
    const tocMembers = [];

    for(let i = 1; i <= count; i++) {
        tocMembers.push(createTocMember(
            i,
            getRandomInt(1, stakeholdersCount),
            getRandomInt(1, tocsCount)
        ));
    }

    return tocMembers;
};

module.exports = generateTocMembers;