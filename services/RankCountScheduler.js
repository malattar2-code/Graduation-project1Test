// services/RankCountScheduler.js
const cron = require('node-cron');
const rankCountService = require('./RankCountService');

class RankCountScheduler {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ RankCountScheduler is already running');
      return;
    }

    console.log('🚀 Starting RankCountScheduler...');

    // Run every hour to ensure counts are accurate
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ Scheduled: Updating rank user counts...');
        await rankCountService.updateAllRankUserCounts();
        console.log('✅ Scheduled rank count update completed');
      } catch (error) {
        console.error('❌ Scheduled rank count update failed:', error);
      }
    });

    // Run every day at 2 AM to clean up and refresh
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('⏰ Daily: Force refreshing all rank counts...');
        await rankCountService.forceRefreshAllCounts();
        console.log('✅ Daily rank count refresh completed');
      } catch (error) {
        console.error('❌ Daily rank count refresh failed:', error);
      }
    });

    this.isRunning = true;
    console.log('✅ RankCountScheduler started (runs hourly and daily at 2 AM)');
  }

  stop() {
    // In a real implementation, you might want to stop the cron jobs
    this.isRunning = false;
    console.log('🛑 RankCountScheduler stopped');
  }
}

// Create and start scheduler
const rankCountScheduler = new RankCountScheduler();
module.exports = rankCountScheduler;