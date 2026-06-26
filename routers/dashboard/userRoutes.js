const express = require("express");
const router = express.Router();
const userController = require("../../controller/dashbored/UserRequesterOrDonorsController");

// 🔹 جميع المستخدمين
router.get("/", userController.findAllUsers);

// 🔹 جميع الـ Requesters
router.get("/requesters", userController.requerterUser);

// 🔹 جميع الـ Donors
router.get("/donors", userController.donorUsers);

// 🔹 حذف مستخدم
router.delete("/delete/:id", userController.deleteUser);

module.exports = router;
