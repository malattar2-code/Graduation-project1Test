// const express = require("express");
// const router = express.Router();
// const upload = require("../../middelware/uploade-finanicalRequest");
// const requireAuth = require("../../middelware/requireAuth"); // المصادقة بواسطة Firebase    
// const financialRequestController = require('../../controller/dashbored/finanicalRequstController');

// // ✅ إنشاء طلب مالي
// router.post(
//   "/add",
//   requireAuth,
//   upload.fields([
//     { name: "mainImage", maxCount: 1 },
//     { name: "subImage1", maxCount: 1 },
//     { name: "subImage2", maxCount: 1 },
//     { name: "subImage3", maxCount: 1 },
//   ]),
//   financialRequestController.createRequest
// );

// // ✅ جلب كل الطلبات
// router.get("/", financialRequestController.getAllRequests);

// // ✅ جلب طلب محدد
// router.get("/:id", financialRequestController.getRequestById);

// // ✅ جلب كل طلبات يوزر معين
// router.get("/user/:userId", financialRequestController.getRequestsByUserId);

// // ✅ تحديث طلب
// router.put("/:id", requireAuth, financialRequestController.updateRequest);

// // ✅ حذف طلب
// router.delete("/:id", requireAuth, financialRequestController.deleteRequest);

// module.exports = router;
