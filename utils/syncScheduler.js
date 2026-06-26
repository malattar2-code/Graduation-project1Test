// utils/syncScheduler.js
const cron = require('node-cron');
const categorySyncService = require('../services/categorySyncService');
const userSyncService = require('../services/userSyncService');

class SyncScheduler {
  constructor() {
    this.jobs = [];
    this.realtimeUnsubscribe = null;
    this.userRealtimeUnsubscribe = null;
  }

  /**
   * Schedule automatic sync every X minutes/hours
   * @param {string} cronExpression - Cron expression for categories
   * @param {string} userCronExpression - Cron expression for users
   */
  scheduleAutoSync(cronExpression = '*/50 * * * *', userCronExpression = '*/50 * * * *') {
    // Schedule categories sync
    const categoryJob = cron.schedule(cronExpression, async () => {
      console.log('Running scheduled categories sync at', new Date().toISOString());
      try {
        await categorySyncService.syncBothWays();
        console.log('Scheduled categories sync completed successfully');
      } catch (error) {
        console.error('Scheduled categories sync failed:', error);
      }
    });

    // Schedule users sync every 15 seconds (quarter minute)
    const userJob = cron.schedule(userCronExpression, async () => {
      console.log('Running scheduled users sync at', new Date().toISOString());
      try {
        await userSyncService.syncUsers();
        console.log('Scheduled users sync completed successfully');
      } catch (error) {
        console.error('Scheduled users sync failed:', error);
      }
    });

    this.jobs.push(categoryJob, userJob);
    console.log(`Scheduled categories sync job with cron expression: ${cronExpression}`);
    console.log(`Scheduled users sync job with cron expression: ${userCronExpression}`);
    
    return { categoryJob, userJob };
  }

  /**
   * Start real-time synchronization for both categories and users
   */
  startRealtimeSync() {
    // Start categories real-time sync
    if (!this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe = categorySyncService.startRealtimeSync();
      console.log('Categories real-time synchronization started');
    }

    // Start users real-time sync (if implemented)
    if (!this.userRealtimeUnsubscribe) {
      this.userRealtimeUnsubscribe = userSyncService.startRealtimeSync();
      console.log('Users real-time synchronization started');
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('All scheduled jobs stopped');
  }

  /**
   * Stop real-time sync for both categories and users
   */
  stopRealtimeSync() {
    // Stop categories real-time sync
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
      console.log('Categories real-time synchronization stopped');
    }

    // Stop users real-time sync
    if (this.userRealtimeUnsubscribe) {
      this.userRealtimeUnsubscribe();
      this.userRealtimeUnsubscribe = null;
      console.log('Users real-time synchronization stopped');
    }
  }

  /**
   * Get status of all sync jobs
   */
  getStatus() {
    return {
      scheduledJobs: this.jobs.length,
      categoriesRealtimeSync: this.realtimeUnsubscribe !== null,
      usersRealtimeSync: this.userRealtimeUnsubscribe !== null,
      jobsRunning: this.jobs.filter(job => job.running).length
    };
  }

  /**
   * Schedule only user synchronization
   */
  scheduleUserSync(cronExpression = '*/50 * * * * ') {
    const userJob = cron.schedule(cronExpression, async () => {
      console.log('Running scheduled users sync at', new Date().toISOString());
      try {
        await userSyncService.syncUsers();
        console.log('Scheduled users sync completed successfully');
      } catch (error) {
        console.error('Scheduled users sync failed:', error);
      }
    });

    this.jobs.push(userJob);
    console.log(`Scheduled users sync job with cron expression: ${cronExpression}`);
    return userJob;
  }

  /**
   * Schedule only category synchronization
   */
  scheduleCategorySync(cronExpression = '*/50 * * * *') {
    const categoryJob = cron.schedule(cronExpression, async () => {
      console.log('Running scheduled categories sync at', new Date().toISOString());
      try {
        await categorySyncService.syncBothWays();
        console.log('Scheduled categories sync completed successfully');
      } catch (error) {
        console.error('Scheduled categories sync failed:', error);
      }
    });

    this.jobs.push(categoryJob);
    console.log(`Scheduled categories sync job with cron expression: ${cronExpression}`);
    return categoryJob;
  }
}

module.exports = new SyncScheduler();