// const multer = require("multer");
// const path = require("path");

// // ✅ إعداد التخزين
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/uploads/FinancialRequestImage'); // مجلد الحفظ
//     },
//     filename: function (req, file, cb) {
//         // حفظ الملف باسم فريد (timestamp + الامتداد الأصلي)
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });

// // ✅ التحقق من نوع الملف
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
//     const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

//     if (ext) {
//         cb(null, true); // السماح برفع الملف
//     } else {
//         cb(new Error("❌ صيغة الملف غير مدعومة")); // رفض رفع الملف
//     }
// };

// // ✅ إعداد multer
// const upload = multer({ storage, fileFilter });

// module.exports = upload;
