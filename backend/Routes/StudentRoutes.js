const express = require("express");
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getStudentByID,
  updateStudent,
  convertToRegular
} = require("../Controllers/StudentController");

// Register a new student
router.post("/register", registerStudent);

// Login student
router.post("/login", loginStudent);

// Get student by ID
router.get("/:studentID", getStudentByID);

// Update student profile
router.put("/:studentID", updateStudent);

// Convert temporary student to regular
router.post("/:studentID/convert-to-regular", convertToRegular);

module.exports = router;
