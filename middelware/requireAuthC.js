// // middleware/requireAuth.js
// const { auth, db } = require("../config/firebase-admin");

// async function requireAuth(req, res, next) {
//   try {
//     // الحصول على التوكين من الهيدر أو الكوكي
//     const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized. Token missing." });
//     }

//     // تحقق من التوكين
//     const decodedToken = await auth.verifyIdToken(token);
//     const uid = decodedToken.uid;

//     // جلب بيانات المستخدم من Firestore
//     const userDoc = await db.collection("users").doc(uid).get();
//     if (!userDoc.exists) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const userData = userDoc.data();

//     // تحقق من التفعيل
//     if (!userData.isVerified) {
//       return res.status(403).json({ error: "Email not verified" });
//     }

//     // إضافة بيانات المستخدم للـ request
//     req.user = userData;
//     next();
//   } catch (err) {
//     res.status(401).json({ error: "Unauthorized: " + err.message });
//   }
// }

// module.exports = requireAuth;
// middleware/requireAuth.js
const { auth } = require("../config/firebase-admin");

// const requireAuth = async (req, res, next) => {
//   try {
//     // نحاول نجيب التوكين من الهيدر أو الكوكي
//     const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

//     if (!token) {
//       return res.redirect("/register"); // لو ما فيه توكين
//     }

//     const decodedToken = await auth.verifyIdToken(token);
//     req.user = decodedToken; // نخزن بيانات المستخدم للطلبات القادمة

//     next(); // كل شيء تمام
//   } catch (err) {
//     console.error(err);
//     return res.redirect("/register"); // لو التوكين غير صحيح أو منتهي
//   }
// };
// In requireAuth.js - TEMPORARY FIX for testing
const requireAuth = async (req, res, next) => {
  // Temporary: bypass auth for sync routes
  if (req.path.includes('/sync-') || req.path.includes('/comments/') || req.path === '/') {
    console.log('🔄 Bypassing auth for sync route:', req.path);
    return next();
  }

  try {
    // نحاول نجيب التوكين من الهيدر أو الكوكي
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return res.redirect("/register"); // لو ما فيه توكين
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; // نخزن بيانات المستخدم للطلبات القادمة

    next(); // كل شيء تمام
  } catch (err) {
    console.error(err);
    return res.redirect("/register"); // لو التوكين غير صحيح أو منتهي
  }
};

module.exports = requireAuth;

