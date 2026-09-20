const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Attach user object for role checking
    const user = await User.findById(req.userId).select("-password");
    if (user) req.user = user;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User authentication required" });
    }
    const userRole = req.user.role || "Student";
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Role '${userRole}' does not have permission for this resource. Required: [${allowedRoles.join(", ")}]`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };