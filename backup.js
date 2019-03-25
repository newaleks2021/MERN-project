const serviceAccount = require('./serviceAccountKey.json');
const firebaseAdmin = require('firebase-admin');
const fs = require('fs');

const initiateBackup = () => {
	console.log("Starting backup");
  //1. Download the database
  ref.once('value', (snapshot) => {
    //2. Get a filename for the file, which is just a sanitised date (see below)
    let file = getPathToFile('/data/backup/firebase/', 'json');
    //3. Stringify the payload
    let json = JSON.stringify(snapshot.val());
    //4. Write the file to disk
    fs.writeFile(file, json, (err) => {
	    console.log("Wrote backup!");
	  process.exit(0);
    });
  });
};

const getPathToFile = (path, format) => {
  return path + serviceAccount.project_id + '-' + (new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''))+'.'+format;
};

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
});
const db = firebaseAdmin.database();
const ref = db.ref();

initiateBackup();
