// services/rankSyncService.js
// Firebase-PostgreSQL synchronization is disabled per project requirements

class RankSyncService {
  constructor() {
    this.isListening = false;
    console.log('ℹ️ Rank Sync Service initialized (sync disabled)');
  }

  async init() {
    console.log('ℹ️ Rank sync init skipped (disabled)');
  }

  setupRealTimeListener() {
    console.log('ℹ️ Firestore listener setup skipped (disabled)');
  }

  async processDocumentChange(change) {
    console.log('ℹ️ Document change processing skipped (disabled)');
  }

  async createOrUpdateRank(firestoreDocId, firestoreData) {
    console.log('ℹ️ Rank create/update skipped (disabled)');
  }

  async deleteRank(firestoreDocId) {
    console.log('ℹ️ Rank delete skipped (disabled)');
  }

  async syncAllRanks() {
    console.log('ℹ️ Full rank sync skipped (disabled)');
  }

  async manualSync() {
    console.log('ℹ️ Manual sync skipped (disabled)');
  }

  async updateFirestoreWithCorrectCounts() {
    console.log('ℹ️ Firestore count update skipped (disabled)');
  }

  getStatus() {
    return {
      isListening: false,
      service: 'RankSyncService',
      mode: 'sync-disabled'
    };
  }
}

const rankSyncService = new RankSyncService();
module.exports = rankSyncService;