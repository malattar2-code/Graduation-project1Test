const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const bcrypt         = require('bcryptjs');
const User           = require('../models/User');
const Admin          = require('../models/Admin');   // ← ADD THIS LINE

// ─── Serialize: store "user:123" or "admin:123" ────────────────────────────
passport.serializeUser((user, done) => {
  const isAdmin = user.isAdmin || user.user_type === 'admin' || user.role === 'admin';
  const key     = isAdmin ? `admin:${user.id}` : `user:${user.id}`;
  done(null, key);
});

// ─── Deserialize: resolve the prefixed key back to the correct model ─────────
passport.deserializeUser(async (key, done) => {
  try {
    // Legacy sessions stored a plain integer → treat them as regular users
    if (typeof key === 'number' || (typeof key === 'string' && !key.includes(':'))) {
      const id   = parseInt(key, 10);
      const user = await User.scope('withPassword').findByPk(id);
      return done(null, user || false);
    }

    const [type, idStr] = key.split(':');
    const id            = parseInt(idStr, 10);

    if (type === 'admin') {
      const admin = await Admin.findByPk(id);
      if (admin) admin.isAdmin = true;   // flag used later in controller / middleware
      return done(null, admin || false);
    }

    const user = await User.scope('withPassword').findByPk(id);
    done(null, user || false);
  } catch (err) {
    done(err, false);
  }
});

// ─── Local Strategy ───────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        // 1) Try the regular users table first
        const user = await User.findOne({
          where: { email: email.toLowerCase().trim() },
          attributes: {
            include: [
              'password',
              'verification_code',
              'verification_code_expires_at',
              'password_reset_code',
              'password_reset_expires_at'
            ]
          }
        });

        if (user) {
          if (user.is_banned) {
            return done(null, false, {
              message: 'Your account has been suspended. Please contact support.',
              banned: true
            });
          }
          if (!user.is_verified) {
            return done(null, false, {
              message: 'Please verify your email before logging in.',
              unverified: true
            });
          }
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        }

                // 2) No user found → try the admins table
        const admin = await Admin.unscoped().findOne({
          where: { email: email.toLowerCase().trim() }
        });

        if (!admin) {
          return done(null, false, { message: 'No account found with that email.' });
        }

        if (!admin.is_active) {
          return done(null, false, { message: 'Account is disabled.' });
        }

        if (admin.is_banned) {
          return done(null, false, {
            message: 'Your account has been suspended. Please contact support.',
            banned: true
          });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        admin.isAdmin = true;   // mark so the controller knows to send the admin redirect
        return done(null, admin);

        
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;