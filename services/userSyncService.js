// services/userSyncService.js
const { syncFirebaseUsers } = require('../utils/syncUser');

class UserSyncService {
  /**
   * Synchronize users between Firebase and PostgreSQL
   */
  async syncUsers() {
    try {
      console.log('Starting user synchronization...');
      await syncFirebaseUsers();
      console.log('User synchronization completed successfully');
    } catch (error) {
      console.error('User synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time user synchronization (if needed in the future)
   */
  startRealtimeSync() {
    // Implement real-time user sync if needed
    console.log('Real-time user sync started');
    
    // Return unsubscribe function
    return () => {
      console.log('Real-time user sync stopped');
    };
  }
}

module.exports = new UserSyncService();