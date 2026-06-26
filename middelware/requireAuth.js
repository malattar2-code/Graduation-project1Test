// middleware/requireAuth.js
// Session-based authentication middleware (Passport.js + PostgreSQL)
// Replaces the old Firebase token-based requireAuth

/**
 * Protects routes that require a logged-in, verified, non-banned user.
 * Works with express-session + passport.js.
 */
// middleware/requireAuth.js
const requireAuth = (req, res, next) => {
  // Allow only specific public paths – do NOT include '/'
  const publicPaths = ['/sync-', '/comments/'];
  const isPublic = publicPaths.some(p => req.path.startsWith(p));
  if (isPublic) {
    console.log('🔄 Bypassing auth for public route:', req.path);
    return next();
  }

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    return res.redirect('/register');
  }

  const user = req.user;

  // ── Extra guards (belt-and-suspenders, passport strategy already checks these) ──
  if (user.is_banned) {
    req.logout(err => { if (err) console.error(err); });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ success: false, error: 'Account suspended.', banned: true });
    }
    return res.redirect('/register');
  }

  if (!user.is_verified) {
    req.logout(err => { if (err) console.error(err); });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ success: false, error: 'Email not verified.', unverified: true });
    }
    return res.redirect('/register');
  }

  next();
};

/**
 * Admin-only guard (checks user_type).
 */
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!req.user || req.user.user_type !== 'admin') {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ success: false, error: 'Admin access required.' });
      }
      return res.redirect('/register');
    }
    next();
  });
};

module.exports = { requireAuth, requireAdmin };