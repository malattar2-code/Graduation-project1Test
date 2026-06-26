// services/userRankPointsSync.js
// DISABLED: Firestore synchronization removed per project requirements.
// All user rank points data now resides exclusively in PostgreSQL.

class UserRankPointsSync {
  constructor() {
    console.log('ℹ️ Firestore sync disabled. Using PostgreSQL as single source of truth.');
  }
}

module.exports = new UserRankPointsSync();