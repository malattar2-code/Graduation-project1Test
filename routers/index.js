const express = require('express');
const router = express.Router(); // لاحظ الأقواس
// ///////////////////////////////////////
// router.get('/', (req, res) => {
//   res.send('API is working!');
// });
// ///////////////////////////////////////
// // استدعاء الراوتات
const bannerRoutes = require("./dashboard/bannerRoutes");
const requestRoutes = require("./dashboard/requestRoutes");
const adminPanalRoute = require("./dashboard/adminPanalRoute");
// const authRoutes = require("./site/authRout");
// const RequesterPanalRoute = require("./dashboard/UserRequesterPanalRoute");
// const financialRequestRoute = require("./dashboard/FinanicalRequestRoute");
const categoriesRoute =require("./site/categoriesRoute");
const indexRoute = require('./site/indexRoute');
const faqRoute = require('./site/faqRoute');
const userPanelIndigentRoute = require('./dashboard/userPanelIndigentRoute');
const userPanelDonorRoute = require('./dashboard/userPanelDonorRoutes');
const userRegistrationRoutes = require('./site/userRegistrationRoutes');
const donorAccountRoute = require('./site/donorAccountRoute'); // adjust path as needed
const paymentRoutes = require('../routers/dashboard/paymentRoutes');
const reportRoutes = require("./dashboard/reportRoute");
const printReportRoutes = require('./dashboard/printReportRoutes');
const achievementRoutes = require('./site/achievementRoutes');
const allAchievementsRoutes = require('./site/allAchievementsRoutes');
router.use('/register', userRegistrationRoutes);
router.use("/", indexRoute);
router.use('/api/payments', paymentRoutes);

// // استخدام الراوتات
// router.use("/", authRoutes);
// ////////////////////////////////////////
router.use("/banners", bannerRoutes);
router.use("/requests", requestRoutes);
// router.use("/financial",financialRequestRoute)
router.use("/", adminPanalRoute);
// router.use("/", RequesterPanalRoute);
router.use("/", categoriesRoute);
router.use('/', achievementRoutes);

router.use('/', allAchievementsRoutes);
router.use('/faqs', faqRoute);
router.use('/userPanelIndigent', userPanelIndigentRoute);
router.use('/register', userRegistrationRoutes);
router.use('/userPanelDonor', userPanelDonorRoute);
router.use('/', donorAccountRoute);
router.use('/api', reportRoutes);
router.use('/api', printReportRoutes);

// ////////////////////////////////////////

module.exports = router; // ✅ تأكد من وجود هذا السطر

