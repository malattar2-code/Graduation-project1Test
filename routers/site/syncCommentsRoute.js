const express = require("express");
const router = express.Router();
// DISABLED: Firebase sync service removed per requirements
// const SyncComments = require('../../services/syncComments');
const Comment = require('../../models/Comment');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// DISABLED: Firebase-PostgreSQL sync endpoints disabled per requirements
router.post('/comments/sync-all', async (req, res) => {
  console.log('🚫 Sync to Firebase is disabled');
  res.status(501).json({
    success: false,
    message: 'Firebase synchronization is disabled'
  });
});

router.post('/comments/sync/:commentId', async (req, res) => {
  console.log('🚫 Single comment sync to Firebase is disabled');
  res.status(501).json({
    success: false,
    message: 'Firebase synchronization is disabled'
  });
});

router.get('/comments/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Sync service is disabled. PostgreSQL is the primary data store.',
    firestore: false,
    collection: false
  });
});

router.get('/comments/debug', async (req, res) => {
  console.log('🔍 Debug sync route hit');
  
  res.json({
    success: true,
    message: 'Debug route working - sync disabled',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;