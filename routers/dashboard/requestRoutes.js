const express = require("express");
const router = express.Router();
const requestController = require("../../controller/dashbored/RequestController");
const { requireAuth, requireAdmin } = require("../../middelware/requireAuth");

// حماية جميع routes الطلبات — admin فقط
router.use(requireAuth, requireAdmin);

// 🔹 جميع الطلبات مع النسبة المئوية
router.get("/", requestController.findAllRequest);

// 🔹 الطلبات المكتملة
router.get("/completed", requestController.CompleteRequest);

// 🔹 الطلبات غير المكتملة
router.get("/incomplete", requestController.IncompleteRequest);

// 🔹 الطلبات قيد التنفيذ
router.get("/in-progress", requestController.InProgresRequest);

// 🔹 تحديث التفعيل (إلغاء التفعيل)
router.put("/:id/unactivate", requestController.updateActivationUnActve);

// 🔹 تحديث التفعيل (تفعيل)
router.put("/:id/activate", requestController.updateActivationActve);
// 
// 🔹 تحديث الحالة (إرجاع من in_progress → pending)
router.put("/:id/reset-status", requestController.updateStatusInProgres);

router.get('/get-user/:id', requestController.getUserById);

module.exports = router;