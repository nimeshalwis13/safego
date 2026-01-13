const Admin = require("../Model/AdminModel");
const Counter = require("../Model/CounterModel");
const Student = require("../Model/StudentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "safego-admin-secret-key-2025";

// REGISTER NEW ADMIN
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validate password strength
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        error: "Admin with this email or username already exists" 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName
    });

    await newAdmin.save();

    // Remove password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      message: "Admin registered successfully",
      admin: adminResponse
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN ADMIN
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        username: admin.username
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      message: "Login successful",
      admin: adminResponse,
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ADMIN PROFILE
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ADMINS (Super Admin only)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select("-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ADMIN STATUS
const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RESET STUDENT ID COUNTER
const resetStudentCounter = async (req, res) => {
  try {
    // Check if there are any students in the database
    const studentCount = await Student.countDocuments();
    
    if (studentCount > 0) {
      return res.status(400).json({ 
        error: "Cannot reset counter while students exist in database",
        message: "Please delete all students first before resetting the counter",
        currentStudentCount: studentCount
      });
    }

    // Reset the counter to 0
    await Counter.findByIdAndUpdate(
      { _id: "studentID" },
      { sequenceValue: 0 },
      { upsert: true }
    );

    res.json({
      message: "Student ID counter has been reset successfully",
      info: "Next student will receive ID: SGS0001"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET STUDENT COUNTER STATUS
const getStudentCounterStatus = async (req, res) => {
  try {
    const counter = await Counter.findById("studentID");
    const studentCount = await Student.countDocuments();
    
    let nextStudentID = "SGS0001";
    if (counter && counter.sequenceValue > 0) {
      const nextNumber = (counter.sequenceValue + 1).toString().padStart(4, '0');
      nextStudentID = `SGS${nextNumber}`;
    }

    res.json({
      currentCounter: counter ? counter.sequenceValue : 0,
      totalStudents: studentCount,
      nextStudentID: nextStudentID,
      canReset: studentCount === 0
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getAllAdmins,
  updateAdminStatus,
  resetStudentCounter,
  getStudentCounterStatus
};