const assert = require('assert');
const axios = require('axios');

const CLIENT_URL = 'https://changeroo:@cc3s@app.changeroo.stage-env.com/';

describe('Load client', function () {
  let endpoint = CLIENT_URL + "project/dfc5785d-374d-4e4f-95e4-3ea7df591c06";
    
  it('Should return an http response', function (done) {
    axios.get(endpoint).then((response) => {
      done();
    }).catch((error) => {
      done(error);
    })
  });
  // 
  
});