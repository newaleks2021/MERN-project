const {FIREBASE_DATABASE_ID} = process.env;
const serviceAccount = require('../serviceAccountKey.json');
const firebaseAdmin = require('firebase-admin');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://" + FIREBASE_DATABASE_ID + ".firebaseio.com"
});

module.exports = firebaseAdmin;
