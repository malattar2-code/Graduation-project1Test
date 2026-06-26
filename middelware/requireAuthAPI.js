// middelware/requireAuthAPI.js
// PostgreSQL session-based API authentication
// Replaces Firebase token verification with Passport.js session auth

const requireAuthAPI = (req, res, next) => {
  try {
    console.log('🔐 API Auth - Checking session...');

    // Use Passport.js session authentication (PostgreSQL-backed)
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      console.log('❌ API Auth - No active session');
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please login." 
      });
    }

    const user = req.user;

    // Guard: banned users
    if (user.is_banned) {
      req.logout(err => { if (err) console.error(err); });
      return res.status(403).json({ 
        success: false, 
        error: 'Account suspended.', 
        banned: true 
      });
    }

    // Guard: unverified users
    if (!user.is_verified) {
      req.logout(err => { if (err) console.error(err); });
      return res.status(403).json({ 
        success: false, 
        error: 'Email not verified.', 
        unverified: true 
      });
    }

    console.log('✅ API Auth - Session verified for user:', user.email);
    next();
    
  } catch (error) {
    console.error('❌ API Auth Error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: "Authentication error: " + error.message 
    });
  }
};

module.exports = requireAuthAPI;