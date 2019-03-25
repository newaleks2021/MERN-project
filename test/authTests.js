const chai = require('chai');
const chaiHttp = require('chai-http');

const loginController = require('../controllers/auth/loginController');
const registrationController = require('../controllers/auth/registrationController');
const app = require('../app');
const Stakeholder = require('../models/stakeholder');

chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Auth', () => {
    describe('Login', () => {
        const falseCredentials = {
            email: 'bla@bla.com',
            password: 'bla'
        };

        const credentials = {
            email: 'test@test.com',
            password: 'test'
        };

        it('should not login on wrong combination of credentials', (done) => {
            chai.request(app)
                .post('/login')
                .send(falseCredentials)
                .end((err, res) => {
                    // assert
                    expect(res).to.have.status(401);
                    done();
                });
        });

        it('should return JSON web token on login', (done) => {
            chai.request(app)
                .post('/login')
                .send(credentials)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    assert.isString(res.body.token);
                    done();
                    // TODO: expect redirect to
                });
        })
    });

    describe('Registration', () => {
        const falseUser = {
            email: '',
            password: 'test',
            username: '',
            full_name: 'Test Test'
        };

        const maliciousUser = {
            email: 'malicious@email.com',
            password: 'test',
            username: '404',
            full_name: 'Malicious Username'
        };

        const existingUser = {
            email: 'test@test.com',
            password: 'test',
            username: 'test',
            full_name: 'Test Test'
        };

        const newUser = {
            email: 'newuser@new.com',
            password: 'newuser123',
            username: 'squirrelhunt69',
            full_name: 'New User'
        };

        it('should throw constrain errors on missing data', (done) => {
            chai.request(app)
                .post('/register')
                .send(falseUser)
                .end((err, res) => {
                    expect(res).to.have.status(422);
                    assert.isObject(res.body.message);
                    done();
                });
        });

        it('should not register malicious usernames', (done) => {
            chai.request(app) 
                .post('/register')
                .send(maliciousUser)
                .end((err, res) => {
                    expect(res).to.have.status(422)
                    done();
                });
        });

        it('should not register already existing credentials', (done) => {
            chai.request(app)
                .post('/register')
                .send(existingUser)
                .end((err, res) => {
                    expect(res).to.have.status(422);
                    done();
                });
        });

        it('should register a new user', (done) => {
            chai.request(app)
                .post('/register')
                .send(newUser)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });
});