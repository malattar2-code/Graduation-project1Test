// const FinancialRequest = require('../../models/Financial_requests');
// const User = require('../../models/User');
// const {auth} = require('../../config/firebase-admin');

// // 📌 إنشاء طلب مالي جديد
// exports.createRequest = async (req, res) => {
//   try {
//     const firebaseUid = req.user.uid;

//     // ✅ جلب بيانات اليوزر من Firebase
//     const firebaseUser = await auth.getUser(firebaseUid);

//     // ✅ التأكد إذا اليوزر موجود في DB
//     let user = await User.findOne({ where: { firebase_uid: firebaseUid } });

//     // ✅ إذا مش موجود → ننشئه
//     if (!user) {
//       if (!user) return res.status(404).json({ message: "User not found" });
//     }

//     // ✅ الصور
//     let mainImage = req.files["mainImage"] ? req.files["mainImage"][0].filename : null;
//     let subImage1 = req.files["subImage1"] ? req.files["subImage1"][0].filename : null;
//     let subImage2 = req.files["subImage2"] ? req.files["subImage2"][0].filename : null;
//     let subImage3 = req.files["subImage3"] ? req.files["subImage3"][0].filename : null;

//     // ✅ إنشاء الطلب
//     const request = await FinancialRequest.create({
//       title: req.body.title,
//       description: req.body.description,
//       target_amount: req.body.target_amount,
//       mainImage,
//       subImage1,
//       subImage2,
//       subImage3,
//       category: req.body.category || null,
//       status: "pending",
//       activation: "active",
//       userId: user.id, // ⬅️ صار عندنا يوزر أكيد
//     });

//     res.status(201).json({ message: "Request created successfully", data: request });
//   } catch (err) {
//     console.error("❌ Error in createRequest:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// // 📌 جلب جميع الطلبات
// exports.getAllRequests = async (req, res) => {
//   try {
//     const requests = await FinancialRequest.findAll({
//       include: [{ model: User, as: "user", attributes: ["id", "fullName", "email"] }],
//       order: [["createdAt", "DESC"]],
//     });

//     res.json(requests);
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // 📌 جلب طلب واحد
// exports.getRequestById = async (req, res) => {
//   try {
//     const request = await FinancialRequest.findByPk(req.params.id, {
//       include: [{ model: User, as: "users", attributes: ["id", "fullName", "email"] }],
//     });

//     if (!request) return res.status(404).json({ message: "Request not found" });

//     res.json(request);
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// }
// // 📌 Get all financial requests for a specific userId
// // 📌 جيب جميع الطلبات المالية لمستخدم معين
// exports.getRequestsByUserId = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.status(400).json({ message: "Missing userId" });
//     }

//     // جيب جميع الطلبات بهذا user_id
//     const requests = await FinancialRequest.findAll({
//       where: { user_id: userId } // أو userId حسب اسم العمود في الموديل
//     });

//     if (!requests || requests.length === 0) {
//       return res.status(404).json({ message: "No requests found for this user" });
//     }

//     res.json(requests);
//   } catch (err) {
//     console.error("❌ Error fetching requests:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };




// // 📌 تحديث طلب (فقط صاحب الطلب)
// exports.updateRequest = async (req, res) => {
//   try {
//     const firebaseUid = req.user.uid;
//     const user = await User.findOne({ where: { firebase_uid: firebaseUid } });

//     const request = await FinancialRequest.findByPk(req.params.id);
//     if (!request) return res.status(404).json({ message: "Request not found" });

//     if (request.userId !== user.id) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     await request.update({
//       title: req.body.title || request.title,
//       description: req.body.description || request.description,
//       target_amount: req.body.target_amount || request.target_amount,
//       category: req.body.category || request.category,
//       status: req.body.status || request.status,
//       activation: req.body.activation || request.activation,
//     });

//     res.json(request);
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // 📌 حذف طلب (فقط صاحب الطلب)
// exports.deleteRequest = async (req, res) => {
//   try {
//     const firebaseUid = req.user.uid;
//     const user = await User.findOne({ where: { firebase_uid: firebaseUid } });

//     const request = await FinancialRequest.findByPk(req.params.id);
//     if (!request) return res.status(404).json({ message: "Request not found" });

//     if (request.userId !== user.id) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     await request.destroy();
//     res.json({ message: "Request deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };