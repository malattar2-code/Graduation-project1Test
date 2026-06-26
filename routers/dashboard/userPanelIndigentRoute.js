const express    = require("express");
const router     = express.Router();
const rateLimit  = require("express-rate-limit");
const userPanelIndigentController = require('../../controller/dashbored/userPanelIndigentController');
const { requireAuth } = require("../../middelware/requireAuth");
const upload     = require("../../utils/uploadMiddleware");
const { validateAchievement } = require('../../validations/auth_validation');
router.use(requireAuth);

// Rate limiter specifically for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 uploads per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many uploads from this IP. Please try again later."
  }
});

router.get('/userPanelIndigent', userPanelIndigentController.getUserPanel);

router.post('/userPanelIndigent', upload.fields([
  { name: "mainImage",  maxCount: 1 },
  { name: "subImage1",  maxCount: 1 },
  { name: "subImage2",  maxCount: 1 },
  { name: "subImage3",  maxCount: 1 },
  { name: "fundraiserVideo", maxCount: 1 }
]), userPanelIndigentController.createFundraiser);

router.post('/delete-fundraiser/:id', userPanelIndigentController.deleteFundraiser);

router.post('/api/verification/submit', upload.fields([
  { name: "needDocument", maxCount: 1 },
  { name: "charityLicenseCertificate", maxCount: 1 }
]), userPanelIndigentController.submitVerification);

router.get('/api/verification/status/:fundraiserId', userPanelIndigentController.getVerificationStatus);

// Achievement routes
router.post('/api/achievements/create', upload.fields([
  { name: 'achievementMainImage', maxCount: 1 },
  { name: 'achievementSubImage1', maxCount: 1 },
  { name: 'achievementSubImage2', maxCount: 1 },
  { name: 'achievementSubImage3', maxCount: 1 },
  { name: 'achievementVideo', maxCount: 1 }
]), validateAchievement, userPanelIndigentController.createAchievement);

router.get('/api/achievements/:fundraiserId', userPanelIndigentController.getAchievements);
module.exports = router;