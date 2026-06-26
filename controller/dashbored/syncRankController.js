const admin = require('firebase-admin');
const Rank = require('../../models/Rank');
const rankSyncService = require('../../services/rankSyncService');
class SyncController {
  setupFirestoreListeners() {
    const db = admin.firestore();
    
    // Listen for new ranks
    db.collection('ranks').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        try {
          if (change.type === 'added') {
            await this.syncRankToPostgres(change.doc);
          }
          if (change.type === 'modified') {
            await this.updateRankInPostgres(change.doc);
          }
          if (change.type === 'removed') {
            await this.deleteRankFromPostgres(change.doc.id);
          }
        } catch (error) {
          console.error('Error syncing rank:', error);
        }
      });
    });
  }

  async syncRankToPostgres(firestoreDoc) {
    try {
      const rankData = firestoreDoc.data();
      
      await Rank.upsert({
        rankName: rankData.rankName || '',
        rankDescription: rankData.rankDescription || '',
        minimumPoints: rankData.rankMinimumPoints || rankData.minimumPoints || 0,
        maximumPoints: rankData.rankMaximumPoints || rankData.maximumPoints || 0,
        rankImage: rankData.rankImage || '',
        rewardName: rankData.rewardName || '',
        rewardImage: rankData.rewardImage || '',
        numOfUsersInRank: rankData.numOfUsersInRank || 0,
        firestoreDocId: firestoreDoc.id
      }, {
        where: { firestoreDocId: firestoreDoc.id }
      });
      
      console.log(`✅ Upserted rank ${firestoreDoc.id} to PostgreSQL`);
    } catch (error) {
      console.error('❌ Error upserting rank to PostgreSQL:', error);
    }
  }

  async updateRankInPostgres(firestoreDoc) {
    try {
      const rankData = firestoreDoc.data();
      
      await Rank.update({
        rankName: rankData.rankName || '',
        rankDescription: rankData.rankDescription || '',
        minimumPoints: rankData.minimumPoints || rankData.rankMinimumPoints || 0, // Fixed
        maximumPoints: rankData.maximumPoints || rankData.rankMaximumPoints || 0, // Fixed
        rankImage: rankData.rankImage || '',
        rewardName: rankData.rewardName || '',
        rewardImage: rankData.rewardImage || '',
        numOfUsersInRank: rankData.numOfUsersInRank || 0
      }, {
        where: { firestoreDocId: firestoreDoc.id }
      });
      
      console.log(`✅ Updated rank ${firestoreDoc.id} in PostgreSQL`);
    } catch (error) {
      console.error('❌ Error updating rank in PostgreSQL:', error);
    }
  }

  async deleteRankFromPostgres(firestoreDocId) {
    try {
      await Rank.destroy({
        where: { firestoreDocId: firestoreDocId }
      });
      
      console.log(`✅ Deleted rank ${firestoreDocId} from PostgreSQL`);
    } catch (error) {
      console.error('❌ Error deleting rank from PostgreSQL:', error);
    }
  }

  // Manual sync method for initial synchronization
  async syncAllRanks() {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection('ranks').get();
      
      console.log(`🔄 Syncing ${snapshot.size} ranks from Firestore to PostgreSQL`);
      
      for (const doc of snapshot.docs) {
        await this.syncRankToPostgres(doc);
      }
      
      console.log('✅ Initial rank synchronization completed');
    } catch (error) {
      console.error('❌ Error in initial synchronization:', error);
    }
  }
  // Add this new method for manual sync
  async manualSyncRanks(req, res) {
    try {
      console.log('🔄 Manual rank sync requested');
      
      await rankSyncService.manualSync();
      
      res.json({
        success: true,
        message: 'Manual rank synchronization completed'
      });
    } catch (error) {
      console.error('❌ Error in manual sync:', error);
      res.status(500).json({
        success: false,
        message: 'Error during manual synchronization'
      });
    }
  }

  // Add this method to check sync status
  async getSyncStatus(req, res) {
    try {
      const status = rankSyncService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting sync status'
      });
    }
  }
}

module.exports = new SyncController();