// utils/fixFirestoreCounts.js
const rankCountService = require('../services/RankCountService');
const rankSyncService = require('../services/rankSyncService');

async function fixFirestoreCounts() {
  try {
    console.log('🔄 Fixing Firestore rank counts...');
    
    // First, ensure all PostgreSQL counts are correct
    await rankCountService.forceRefreshAllCounts();
    
    // Then update Firestore with the correct counts
    await rankSyncService.updateFirestoreWithCorrectCounts();
    
    console.log('✅ Firestore counts fixed successfully');
  } catch (error) {
    console.error('❌ Error fixing Firestore counts:', error);
  }
}


fixFirestoreCounts();