// middleware/requireRole.js
// يتحقق من صلاحيات المستخدم بناءً على نوعه أو دوره
// يدعم: user_type (للمستخدمين العاديين) + role (للأدمن) + isAdmin flag
module.exports = function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      return res.redirect("/register");
    }

    // تحقق من isAdmin flag (يُضاف في passport.js عند تسجيل دخول الأدمن)
    if (req.user.isAdmin && allowed.includes('admin')) return next();

    // تحقق من user_type (للمستخدمين العاديين: Donor, requester, Charity)
    const userType = (req.user.user_type || "").toString().toLowerCase();
    if (allowed.includes(userType)) return next();

    // تحقق من role (للأدمن: admin, superadmin, moderator)
    const userRole = (req.user.role || "").toString().toLowerCase();
    if (allowed.includes(userRole)) return next();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ success: false, error: "Forbidden: insufficient role" });
    }
    return res.status(403).render('errors/403', { message: 'ليس لديك صلاحية للوصول لهذه الصفحة' });
  };
};
