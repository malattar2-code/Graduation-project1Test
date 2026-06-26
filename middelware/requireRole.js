// middleware/requireRole.js
module.exports = function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
     return res.redirect("/register"); // لو ما فيه توكين
    }
    const userRole = (req.user.role || "").toString().toLowerCase();
    if (allowed.includes(userRole)) return next();
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  };
};
