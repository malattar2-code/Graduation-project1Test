// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { buildFirebaseStats } = require('../../controller/dashbored/repController');

// GET /api/report/data  -> يعيد firebase-structure.json (ويحدّثه من Firebase)
router.get('/report/data', async (req, res) => {
    try {
        // عند الطلب سيُعاد بناء الإحصائيات من Firestore
        const result = await buildFirebaseStats({ writeToFile: true }); // يكتب أيضاً على report/firebase-structure.json
        res.json(result);
    } catch (err) {
        console.error('Error building firebase stats:', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

module.exports = router;
