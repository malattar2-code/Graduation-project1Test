// controller/site/authController.js
const { db, auth } = require("../../config/firebase-admin.js");
const { sendVerificationEmail } = require("../../utils/mailer");
const { FieldValue, GeoPoint } = require("firebase-admin/firestore");
const path = require('path');

// عرض صفحة التسجيل (لو عندك EJS أو Handlebars)
exports.gotoregister = (req, res) => {
  res.render('site/registration', {
    title: 'Register',
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || ''
  });
};

// تسجيل مستخدم جديد - Updated to follow categories pattern
exports.register = async (req, res) => {
  try {
    console.log('=== USER REGISTRATION REQUEST ===');
    console.log('Request body:', req.body);

    const { email, password, firstName, lastName, gender, phone, birthDate, location, userType, imageUrl } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      console.log('Validation failed: Required fields missing');
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    // إنشاء مستخدم في Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    const uid = userRecord.uid;
    const fullName = `${firstName} ${lastName}`;

    const geoLocation = location?.latitude && location?.longitude
      ? new GeoPoint(location.latitude, location.longitude)
      : null;

    // Prepare user data (following categories pattern)
    const userData = {
      uid,
      email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName,
      gender: gender || null,
      phone: phone || null,
      birthDate: birthDate || null,
      location: geoLocation,
      userType: userType || "requester",
      isVerified: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    // Handle image URL (same as categories)
    if (imageUrl && imageUrl.trim() !== '') {
      userData.userImage = imageUrl.trim();
      console.log('User image URL will be stored:', userData.userImage);
    } else {
      userData.userImage = null;
      console.log('No user image URL provided');
    }

    console.log('User data to save:', userData);

    // إضافة المستخدم في Firestore - Include userImage
    await db.collection("users").doc(uid).set(userData);

    console.log('✅ User created in Firebase:', {
      uid: uid,
      name: fullName,
      image: userData.userImage
    });

    // كود تحقق وإرسال إيميل
    const verifyUrl = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection("verificationCodes").doc(uid).set({
      email,
      verifyUrl,
      createdAt: new Date(),
    });
    await sendVerificationEmail(email, verifyUrl);

    res.json({ 
      success: true,
      message: "User registered. Verification email sent.", 
      email,
      userImage: userData.userImage
    });
    
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// التحقق من البريد الإلكتروني (unchanged)
exports.verifyEmail = async (req, res) => {
  const { email, verifyCode } = req.body;

  try {
    const snapshot = await db.collection("verificationCodes")
      .where("email", "==", email)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return res.status(404).json({ error: "Verification code not found" });

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    const savedCode = data.verifyCode;
    const createdAt = data.createdAt.toDate();
    const uid = docSnap.id;

    // صلاحية الكود (15 دقيقة)
    const expiryTime = 15 * 60 * 1000;
    if (new Date() - createdAt > expiryTime) {
      await docSnap.ref.delete();
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (savedCode !== verifyCode) return res.status(400).json({ error: "Invalid verification code" });

    await db.collection("users").doc(uid).update({ isVerified: true });
    await docSnap.ref.delete();

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// تسجيل الدخول (التحقق من idToken) - unchanged
exports.login = async (req, res) => {
  const { idToken } = req.body; // التوكن القادم من الفرونت

  try {
    // ✅ تحقق من التوكين
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ✅ ابحث في users
    const userDoc = await db.collection("users").doc(uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return res.json({
        message: "Login successful (user)",
        role: "user",
        userType: userData.userType,
        data: userData,
      });
    }

    // ✅ إذا مش موجود في users ابحث في admin
    const adminDoc = await db.collection("admins").doc(uid).get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      return res.json({
        message: "Login successful (admin)",
        role: "admin",
         userType: adminData.userType,
        data: adminData,
      });
    }

    // ❌ لو مش موجود في أي مكان
    return res.status(404).json({
      message: "User not found in users or admin collections",
    });

  } catch (error) {
    return res.status(401).json({
      message: "Login failed",
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // في حالة استخدام Firebase Auth
    const { uid } = req.body;

    if (uid) {
      // إلغاء جميع توكنات المستخدم
      await auth.revokeRefreshTokens(uid);

      // يمكنك أيضاً تحديث حالة المستخدم في Firestore إذا كنت تتتبع حالة تسجيل الدخول
      await db.collection("users").doc(uid).update({
        lastLogout: FieldValue.serverTimestamp()
      }).catch(() => {
        // إذا لم يكن المستخدم موجوداً في collection users، نحاول في admins
        return db.collection("admins").doc(uid).update({
          lastLogout: FieldValue.serverTimestamp()
        });
      });
    }

    // ✅ CRITICAL: Clear the authentication cookie/token
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // ✅ Also clear any session data if you're using sessions
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message
    });
  }
};