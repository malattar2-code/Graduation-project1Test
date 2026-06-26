const express = require("express");
const router = express.Router();
const bannerController = require("../../controller/dashbored/BannerAdminController");
const upload = require("../../middelware/uploade-emergency_relief_banner"); // لو عندك رفع صور

// 🔹 جلب جميع البنرات
router.get("/", bannerController.getAll);

// 🔹 إنشاء Banner جديد
router.post("/create", upload.single("image"), bannerController.create);

// 🔹 تعديل Banner
router.put("/update/:id", upload.single("image"), bannerController.update);

// 🔹 حذف Banner
router.delete("/delete/:id", bannerController.delete);

// 🔹 API إضافي
router.get("/api/all", bannerController.getAllApi);

module.exports = router;
