// middleware/adminCheck.js
export const isAdmin = (req, res, next) => {
  if (req.user.role_id !== 4) {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};
