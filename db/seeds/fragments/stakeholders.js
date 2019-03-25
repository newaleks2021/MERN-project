const faker = require('faker');
const {encrypt} = require('../../../helpers/hashing');
const {newDateNow} = require('../../../helpers/dateHelper');

const createStakeholder = (i, hashedPass) => ({
  id: i,
  email: faker.internet.email().toLowerCase(),
  full_name: faker.name.findName(),
  username: faker.name.firstName().toLowerCase(),
  function: faker.name.jobType(),
  bio: faker.lorem.text(),
  expertise: faker.name.jobDescriptor(),
  avatar: null,
  organisation: faker.company.companyName(),
  phone: faker.phone.phoneNumber(),
  location: faker.address.city(),
  website: faker.internet.url(),
  facebook: faker.internet.url(),
  google_plus: faker.internet.url(),
  instagram: faker.internet.url(),
  linkedin: faker.internet.url(),
  pinterest: faker.internet.url(),
  twitter: faker.internet.url(),
  password_hash: hashedPass,
  login_count: Math.floor((Math.random()*50) + 1),
  last_login_at: newDateNow(),
  created_at: newDateNow()
});

const createTestUser = (i, hashedPass) => ({
  id: i,
  email: 'test@test.com',
  full_name: 'Test Test',
  username: 'test',
  isActivated: 1,
  isAdmin: 1,
  password_hash: hashedPass
});

const generateStakeholders = async (count) => {
  const stakeholders = [];
  
  for(let i = 1; i <= count; i++) {
    const hashedPass = await encrypt(faker.random.word());
    stakeholders.push(createStakeholder(i, hashedPass));
  }
  
  const hashedTest = await encrypt('test');
  stakeholders.push(createTestUser(count+2, hashedTest));
    
  return stakeholders;
};

module.exports = generateStakeholders;
