const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAllAdmins,
  updateAdminStatus,
  resetStudentCounter,
  getStudentCounterStatus
} = require("../Controllers/AdminController");
const { authenticateAdmin, requireSuperAdmin } = require("../middleware/adminAuth");

const router = express.Router();

// Public routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected routes
router.get("/profile", authenticateAdmin, getAdminProfile);
router.get("/all", authenticateAdmin, requireSuperAdmin, getAllAdmins);
router.put("/:id/status", authenticateAdmin, requireSuperAdmin, updateAdminStatus);

// Student counter management routes
router.get("/student-counter/status", authenticateAdmin, getStudentCounterStatus);
router.post("/student-counter/reset", authenticateAdmin, requireSuperAdmin, resetStudentCounter);

module.exports = router;