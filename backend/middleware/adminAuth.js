const jwt = require("jsonwebtoken");
const Admin = require("../Model/AdminModel");

const JWT_SECRET = process.env.JWT_SECRET || "safego-admin-secret-key-2025";

// Verify JWT token
const authenticateAdmin = async (req, res, next) => {
  try {
    console.log("Auth middleware - Headers:", req.headers.authorization);
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("Auth middleware - No token provided");
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    console.log("Auth middleware - Token found, verifying...");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Auth middleware - Token decoded:", { adminId: decoded.adminId });
    
    // Check if admin still exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      console.log("Auth middleware - Admin not found or inactive");
      return res.status(401).json({ error: "Invalid token or admin deactivated." });
    }

    console.log("Auth middleware - Admin authenticated:", admin.username);
    req.adminId = decoded.adminId;
    req.admin = admin; // Add the full admin object for easy access
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({ error: "Invalid token." });
  }
};

// Check if admin is authenticated (all admins have same permissions now)
const requireSuperAdmin = (req, res, next) => {
  // Since we removed roles, all authenticated admins have full access
  // This middleware is kept for backward compatibility but just passes through
  next();
};

module.exports = {
  authenticateAdmin,
  requireSuperAdmin
};