const path             = require('path');
const fs               = require('fs');
const bcrypt           = require('bcryptjs');
const crypto           = require('crypto');
const { Op }           = require('sequelize');
const User             = require('../../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/mailer');
const contentModerator = require('../../services/contentModeratorService');
const { hasValidMX, calculateSpamScore } = require('../../utils/antiSpam');


function generateCode() {
  return String(Math.floor(100000 + crypto.randomInt(900000)));
}
// Helper: writes memory-stored upload (from uploadMiddleware) to disk
function persistMemoryUpload(file, subfolder = 'users') {
  if (!file || !file.buffer) return null;
  const uploadDir = path.join(__dirname, '../../public/uploads', subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname) || '.png';
  const filename = 'user-' + uniqueSuffix + ext;
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${subfolder}/${filename}`;
}
function cleanupUploadedFile(file) {
  if (!file) return;
  try {
    const filePath = path.join(__dirname, '../../public', `/uploads/users/${file.filename}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.error('❌ File cleanup error:', e.message);
  }
}

exports.registerUser = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('=== NEW USER REGISTRATION (PostgreSQL) ===');

    const {
      email,
      password,
      userType,
      firstName,
      lastName,
      gender,
      birthDate,
      charityName,
      charityDescription,
      charityDate,
      charityType,
      charityWebsite,
      charityFacebook,
      charityInstagram,
      charityLinkedIn,
      charityX,
      full_phone_number,
      phone_national,
      phone_international,
      phone_country_iso,
      location
    } = req.validatedData;

    // ── Anti-spam: MX record verification ─────────────────────────────────────
    const mxValid = await hasValidMX(email);
    if (!mxValid) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({
        success: false,
        errors: ['Email domain does not have valid mail records (MX). Please use a real email address.']
      });
    }

    // ── Anti-spam: Spam score calculation ─────────────────────────────────────
    const spamCheck = calculateSpamScore({
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      charityName: charityName || null,
      userType
    });

    if (spamCheck.blocked) {
      cleanupUploadedFile(req.file);
      return res.status(403).json({
        success: false,
        error: 'Registration blocked due to suspicious activity.',
        reasons: spamCheck.reasons,
        score: spamCheck.score
      });
    }

    if (spamCheck.flagged) {
      console.warn('⚠️ Flagged registration attempt:', spamCheck);
    }

    const existingEmail = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      cleanupUploadedFile(req.file);
      return res.status(409).json({ success: false, errors: ['This email is already registered.'] });
    }

    if (full_phone_number) {
      const existingPhone = await User.findOne({ where: { phone_number: full_phone_number } });
      if (existingPhone) {
        cleanupUploadedFile(req.file);
        return res.status(409).json({ success: false, errors: ['This phone number is already registered.'] });
      }
    }

    let fullName = '';
    if (userType === 'charity' && charityName) {
      fullName = charityName;
    } else if (firstName && lastName) {
      fullName = `${firstName.trim()} ${lastName.trim()}`;
    }

    console.log('🔍 Running content moderation...');
    const moderationResult = await contentModerator.validateUserRegistration({
      firstName: firstName || null,
      lastName:  lastName  || null,
      email,
      userImage: req.file ? { buffer: req.file.buffer } : null
    });
    console.log('📊 Moderation result:', moderationResult);

    if (moderationResult.isBanned) {
      cleanupUploadedFile(req.file);
      return res.status(403).json({
        success:        false,
        banned:         true,
        message:        'Your account has been suspended due to a content policy violation.',
        violations:     moderationResult.violations,
        supportContact: 'support@najdah.com'
      });
    }

    const salt           = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    let pgUserType = 'requester';
    if (userType === 'donor')   pgUserType = 'Donor';
    if (userType === 'charity') pgUserType = 'Charity';

    let pgLocation = null;
    if (location?.latitude !== undefined && location?.longitude !== undefined) {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        pgLocation = { type: 'Point', coordinates: [lng, lat] };
      }
    }

    const verifyCode    = generateCode();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // ── PREPARE user data but DO NOT save yet ───────────────────────────────
    const userData = {
      full_name:                  fullName,
      email:                      email.toLowerCase().trim(),
      password:                   hashedPassword,
      is_verified:                false,
      location:                   pgLocation,
      user_type:                  pgUserType,
      is_banned:                  false,
      ban_reason:                 null,
      phone_number:               full_phone_number || null,
      phone_national:             phone_national || null,
      phone_international:        phone_international || null,
      phone_country_iso:          phone_country_iso || null,
      gender:                     gender ? gender.toLowerCase() : null,
      birth_date:                 birthDate || null,
      user_image:                 req.file ? persistMemoryUpload(req.file, 'users') : null,
      charity_name:               charityName               || null,
      charity_description:        charityDescription        || null,
      charity_establishment_date: charityDate               || null,
      charity_type:               charityType               || null,
      charity_website:            charityWebsite            || null,
      charity_facebook:           charityFacebook           || null,
      charity_instagram:          charityInstagram          || null,
      charity_linkedin:           charityLinkedIn           || null,
      charity_x:                  charityX                  || null,
      verification_code:          verifyCode,
      verification_code_expires_at: codeExpiresAt
    };

    // ── SEND VERIFICATION EMAIL FIRST ─────────────────────────────────────────
    // If email fails, user is NOT created in database
    try {
      await sendVerificationEmail(email, verifyCode);
      console.log('✅ Verification email sent to:', email);
    } catch (emailErr) {
      console.error('❌ Failed to send verification email:', emailErr);
      cleanupUploadedFile(req.file);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please check your email address and try again.',
        emailFailed: true
      });
    }

    // ── ONLY CREATE USER IF EMAIL WAS SENT SUCCESSFULLY ───────────────────────
    const user = await User.create(userData);

    console.log(`✅ User created in PostgreSQL: id=${user.id}`);

    if (moderationResult.hasViolations) {
      return res.json({
        success:      true,
        warnings:     true,
        message:      'Account created with content warnings. Please check your email for verification.',
        warningsList: moderationResult.violations,
        email
      });
    }

    return res.json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      email
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    cleanupUploadedFile(req.file);

    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path;
      const msg   = field === 'email'
        ? 'This email is already registered.'
        : field === 'phone_number'
        ? 'This phone number is already registered.'
        : 'A unique constraint was violated.';
      return res.status(409).json({ success: false, errors: [msg] });
    }

    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.verifyUserEmail = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { email, verifyCode } = req.validatedData;

  try {
    console.log(`🔍 Verifying email: ${email}`);

    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (user.is_verified) {
      return res.json({ success: true, message: 'Email already verified. You can log in.' });
    }

    if (!user.verification_code || !user.verification_code_expires_at) {
      return res.status(400).json({ success: false, error: 'No verification code found. Please register again.' });
    }

    if (new Date() > new Date(user.verification_code_expires_at)) {
      await user.update({ verification_code: null, verification_code_expires_at: null });
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
    }

    if (user.verification_code !== verifyCode.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    await user.update({
      is_verified:                  true,
      verification_code:            null,
      verification_code_expires_at: null
    });

    console.log(`✅ Email verified for: ${email}`);
    return res.json({ success: true, message: 'Email verified successfully. You can now log in.' });

  } catch (err) {
    console.error('❌ Verification error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.resendVerificationCode = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user)            return res.status(404).json({ success: false, error: 'User not found.' });
    if (user.is_verified) return res.json({ success: true, message: 'Email is already verified.' });

    const newCode    = generateCode();
    const expiresAt  = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({ verification_code: newCode, verification_code_expires_at: expiresAt });
    await sendVerificationEmail(email, newCode);

    return res.json({ success: true, message: 'New verification code sent to your email.' });
  } catch (err) {
    console.error('❌ Resend code error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.userLogin = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const user = req.user;

  // ── ADMIN LOGIN ────────────────────────────────────────────────────────────
  if (user.isAdmin || user.user_type === 'admin' || user.role === 'admin') {
    return res.json({
      success:  true,
      message:  'Login successful.',
      userType: 'admin',
      userId:   user.id,
      redirectTo: '/admin',   // ← tells the frontend where to go
      user: {
        id:         user.id,
        email:      user.email,
        full_name:  user.full_name,
        user_type:  'admin',
        user_image: user.user_image
      }
    });
  }

  // ── REGULAR USER LOGIN (existing behaviour) ────────────────────────────────
  return res.json({
    success:  true,
    message:  'Login successful.',
    userType: user.user_type,
    userId:   user.id,
    user: {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      user_type:  user.user_type,
      user_image: user.user_image
    }
  });
};

exports.userLogout = (req, res) => {
  req.logout(err => {
    if (err) {
      console.error('❌ Logout error:', err);
      // For AJAX requests, return JSON error
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, error: 'Logout failed.' });
      }
      // For normal requests, redirect with error
      return res.redirect('/?logout=error');
    }
    
    req.session.destroy(sessionErr => {
      if (sessionErr) console.error('❌ Session destroy error:', sessionErr);
      
      res.clearCookie('najdah.sid', { path: '/' });
      
      // For AJAX requests, return success JSON
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Logged out successfully.' });
      }
      
      // For normal requests, redirect to home
      return res.redirect('/?logout=true');
    });
  });
};

exports.sendPasswordResetCode = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { email } = req.validatedData;

  try {
    const user = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a reset code has been sent.' });
    }

    const code      = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({ password_reset_code: code, password_reset_expires_at: expiresAt });
    await sendPasswordResetEmail(email, code);

    console.log(`✅ Password reset code sent to: ${email}`);
    return res.json({ success: true, message: 'Verification code sent to your email.' });

  } catch (err) {
    console.error('❌ Send reset code error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send reset code.' });
  }
};

exports.verifyResetCode = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { email, code } = req.validatedData;

  try {
    const user = await User.scope('withPassword').findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (!user.password_reset_code || !user.password_reset_expires_at) {
      return res.status(400).json({ success: false, error: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > new Date(user.password_reset_expires_at)) {
      await user.update({ password_reset_code: null, password_reset_expires_at: null });
      return res.status(400).json({ success: false, error: 'Reset code has expired. Please request a new one.' });
    }

    if (user.password_reset_code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid reset code.' });
    }

    return res.json({ success: true, message: 'Code verified successfully.' });

  } catch (err) {
    console.error('❌ Verify reset code error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { email, code, newPassword } = req.validatedData;

  try {
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase().trim() }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (!user.password_reset_code || !user.password_reset_expires_at) {
      return res.status(400).json({ success: false, error: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > new Date(user.password_reset_expires_at)) {
      await user.update({ password_reset_code: null, password_reset_expires_at: null });
      return res.status(400).json({ success: false, error: 'Reset code has expired. Please request a new one.' });
    }

    if (user.password_reset_code !== code.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid reset code.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);

    await user.update({
      password:                   hash,
      password_reset_code:        null,
      password_reset_expires_at:  null
    });

    console.log(`✅ Password reset for: ${email}`);
    return res.json({ success: true, message: 'Password reset successfully.' });

  } catch (err) {
    console.error('❌ Reset password error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProfileImage = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId)  return res.status(400).json({ success: false, error: 'Missing user ID.' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded.' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    if (user.user_image) {
      cleanupUploadedFile({ filename: path.basename(user.user_image) });
    }

    const newImagePath = persistMemoryUpload(req.file, 'users');
    await user.update({ user_image: newImagePath });

    return res.json({ success: true, message: 'Profile image updated.', userImage: newImagePath });
  } catch (err) {
    console.error('❌ Update image error:', err);
    cleanupUploadedFile(req.file);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { currentPassword, newPassword } = req.validatedData;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized.' });

    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hash });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ Update password error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.debugUserStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    return res.json({
      success: true,
      user: {
        id:          user.id,
        email:       user.email,
        full_name:   user.full_name,
        user_type:   user.user_type,
        is_verified: user.is_verified,
        is_banned:   user.is_banned,
        ban_reason:  user.ban_reason,
        created_at:  user.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCurrentUser = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not logged in.' });
  }
  const u = req.user;
  return res.json({
    success: true,
    user: {
      id:         u.id,
      email:      u.email,
      full_name:  u.full_name,
      user_type:  u.user_type,
      user_image: u.user_image,
      is_verified: u.is_verified
    }
  });
};

exports.showRegistrationPage = (req, res) => {
  res.render('site/registration', {
    title: 'Register',
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || ''
  });
};