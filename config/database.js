
// config/database.js
const sequelize = require('./dbSQL'); // Your existing Sequelize instance
const admin = require('./firebase-admin'); // Your existing Firebase admin

// Get Firestore instance
const firestore = admin.firestore();

module.exports = {
  sequelize,
  firestore
};