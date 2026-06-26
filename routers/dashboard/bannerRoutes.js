const express = require("express");
const router = express.Router();
const bannerController = require("../../controller/dashbored/BannerAdminController");
const upload = require("../../middelware/uploade-emergency_relief_banner"); // لو عندك رفع صور
const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");

// 🔹 جلب جميع البنرات (مفتوح — يُستخدم في الصفحة الرئيسية)
router.get("/", bannerController.getAll);

// 🔹 API إضافي (مفتوح — يُستخدم في الصفحة الرئيسية)
router.get("/api/all", bannerController.getAllApi);

// 🔹 إنشاء Banner جديد (admin فقط)
router.post("/create", requireAuth, requireAdmin, upload.single("image"), bannerController.create);

// 🔹 تعديل Banner (admin فقط)
router.put("/update/:id", requireAuth, requireAdmin, upload.single("image"), bannerController.update);

// 🔹 حذف Banner (admin فقط)
router.delete("/delete/:id", requireAuth, requireAdmin, bannerController.delete);

module.exports = router;

