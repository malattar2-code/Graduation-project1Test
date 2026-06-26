//firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require('../najdah-17dba-firebase-adminsdk-fbsvc-9fc6084647.json'); // المسار لملف JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://najdah-17dba.firebaseio.com' // استبدلها برابط مشروعك
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = {db , auth, admin} ;