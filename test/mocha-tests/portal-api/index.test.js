const assert = require('assert');
const axios = require('axios');

const API_URL = 'https://changeroo:@cc3s@changeroo.stage-env.com/api';

describe('Load post from mysql', function () {
  let post_id = 2927;
  // TODO: API_URL is missing in Env vars...
  let endpoint = `${API_URL}/toc-academy/posts/${post_id}/json`;
  let res;
  
  beforeEach(function(done) {
    axios.get(endpoint).then((response) => {
      res = response;
      done();
    }).catch((error) => {
      done(error);
    });
  });
    
  it('The response should have an ID that matches the requested ID', function (done) {
    assert.equal(res.data.id,post_id);
    done();
  });
  
  it('The response should have an `acf` key', function (done) {
    assert(res.data.hasOwnProperty('acf'));
    done();
  });
  
});

describe('Authenticated actions', () => {
  let login_endpoint = `${API_URL}/auth/login`;
  let email = 'test@test.com';
  let res;
  
  it('Should be able to login',(done) => {
    axios({
      method: 'POST',
      url: login_endpoint,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: {"email": email ,"password":"test"}
    }).then((response) => {
      res = response;
      done();
    }).catch((error) => {
      console.log(error);
      done(error);
    });
  });
  
  it('When logging in, it should respond with token, firebaseToken and stakeholder keys',(done) => {
    assert.deepEqual(Object.keys(res.data), [ 'token', 'firebaseToken', 'stakeholder' ]);
    done();
  });
  
  it('Should return the data of the correct user', (done) => {
    assert.equal(res.data.stakeholder.email,email);
    done();
  });
});
