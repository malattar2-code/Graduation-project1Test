const express    = require('express');
const router     = express.Router();
const passport   = require('../../config/passport');
const controller = require('../../controller/site/userRegistrationController');
const upload = require('../../utils/uploadMiddleware');
const { requireAuth } = require('../../middelware/requireAuth');
const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts per IP
  message: {
    success: false,
    error: 'Too many registration attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const {
  validateRegister,
  validateVerifyEmail,
  validateUpdatePassword,
  validateSendPasswordResetCode,
  validateVerifyResetCode,
  validateVerifyResetPassword,
  validateUpdateProfileImage
} = require('../../validations/auth_validation');

router.get('/', controller.showRegistrationPage);

router.post(
  '/register',
  registerLimiter, // <-- ADD THIS LINE (first!)
  upload.single('image'),
  validateRegister,
  async (req, res, next) => {
    // ── Anti-spam: Honeypot (zero-cost bot trap) ───────────────────────────
    if (req.body.website) {
      return res.status(400).json({ success: false, errors: ['Spam detected.'] });
    }

    // ── Anti-spam: reCAPTCHA verification ──────────────────────────────────
    const recaptchaToken = req.body['g-recaptcha-response'];
    if (!recaptchaToken) {
      return res.status(400).json({ success: false, errors: ['Please complete the CAPTCHA.'] });
    }
    const { verifyRecaptcha } = require('../../utils/antiSpam');
    const captchaValid = await verifyRecaptcha(recaptchaToken, process.env.RECAPTCHA_SECRET_KEY);
    if (!captchaValid) {
      return res.status(400).json({ success: false, errors: ['CAPTCHA verification failed. Please try again.'] });
    }

    // ── Existing logs ──────────────────────────────────────────────────────
    console.log('📨 Register route — file:', req.file?.filename);
    console.log('📨 Register route — validated data:', req.validatedData);
    console.log('Raw req.body keys:', Object.keys(req.body));
    console.log('Validated data keys:', Object.keys(req.validatedData || {}));

    controller.registerUser(req, res).catch(next);
  }
);

router.post(
  '/verify-email',
  validateVerifyEmail,
  (req, res, next) => controller.verifyUserEmail(req, res).catch(next)
);

router.post(
  '/resend-verification',
  (req, res, next) => controller.resendVerificationCode(req, res).catch(next)
);

router.post(
  '/login',
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        return res.status(401).json({
          success:    false,
          error:      info?.message || 'Invalid credentials.',
          banned:     info?.banned     || false,
          unverified: info?.unverified || false
        });
      }

      req.logIn(user, loginErr => {
        if (loginErr) return next(loginErr);
        return controller.userLogin(req, res);
      });
    })(req, res, next);
  }
);

router.post('/logout', controller.userLogout);
router.get('/logout', controller.userLogout);

router.get('/me', requireAuth, controller.getCurrentUser);

router.post(
  '/send-password-reset-code',
  validateSendPasswordResetCode,
  (req, res, next) => controller.sendPasswordResetCode(req, res).catch(next)
);

router.post(
  '/verify-reset-code',
  validateVerifyResetCode,
  (req, res, next) => controller.verifyResetCode(req, res).catch(next)
);

router.post(
  '/verify-reset-password',
  validateVerifyResetPassword,
  (req, res, next) => controller.resetPassword(req, res).catch(next)
);

router.post(
  '/update-password',
  requireAuth,
  validateUpdatePassword,
  (req, res, next) => controller.updatePassword(req, res).catch(next)
);

router.post(
  '/update-image',
  requireAuth,
  upload.single('image'),
  validateUpdateProfileImage,
  (req, res, next) => controller.updateProfileImage(req, res).catch(next)
);

router.get('/debug-user/:id', controller.debugUserStatus);


module.exports = router;