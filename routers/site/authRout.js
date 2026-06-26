// routes/site/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../../controller/site/authController.js");
const uploadUserImage = require("../../utils/uploadUserImage.js"); // ✅ Correct import

// صفحة التسجيل
router.get("/register", authController.gotoregister);

// ✅ ONLY ONE register route with Multer middleware
router.post("/register", uploadUserImage.single('image'), authController.register);

// تسجيل الدخول
router.post("/login", authController.login);

// التحقق من البريد الإلكتروني
router.post("/verify-email", authController.verifyEmail);
router.post("/logout", authController.logout);

module.exports = router;