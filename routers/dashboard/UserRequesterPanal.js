// const express = require("express");
// const router = express.Router();
// const requireAuth = require("../../middelware/requireAuth"); // المصادقة بواسطة Firebase    
// const userController = require("../../controller/dashbored/UserRequesterPanalController");
// const { auth } = require("../../config/firebase-admin");
// // 🔹 جميع المستخدمين
// router.get("/requester", requireAuth, userController.getRequesterPanal);
// // GET user info
// router.get("/me", requireAuth, async (req, res) => {
//   try {
//     const firebaseUid = req.user.uid; // جاي من requireAuth بعد التحقق من التوكين

//     const userRecord = await auth.getUser(firebaseUid);

//     res.json({
//       uid: userRecord.uid,
//       email: userRecord.email,
//       name: userRecord.displayName || "No Name",
//       photoURL: userRecord.photoURL || null,
//       phoneNumber: userRecord.phoneNumber || null,
//       emailVerified: userRecord.emailVerified,
//       disabled: userRecord.disabled,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });
    
// module.exports = router;