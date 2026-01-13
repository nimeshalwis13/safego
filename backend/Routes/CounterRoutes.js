const express = require("express");
const Counter = require("../Model/CounterModel");
const Student = require("../Model/StudentModel");

const router = express.Router();

// GET current counter status
router.get("/status", async (req, res) => {
  try {
    const counter = await Counter.findById("studentID");
    const studentCount = await Student.countDocuments();
    
    let nextStudentID = "SGS0001";
    if (counter && counter.sequenceValue > 0) {
      const nextNumber = (counter.sequenceValue + 1).toString().padStart(4, '0');
      nextStudentID = `SGS${nextNumber}`;
    }

    res.json({
      success: true,
      currentCounter: counter ? counter.sequenceValue : 0,
      totalStudents: studentCount,
      nextStudentID: nextStudentID,
      canReset: studentCount === 0,
      message: studentCount > 0 
        ? "Cannot reset counter while students exist in database" 
        : "Counter can be reset"
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// POST reset counter (only if no students exist)
router.post("/reset", async (req, res) => {
  try {
    // Check if there are any students in the database
    const studentCount = await Student.countDocuments();
    
    if (studentCount > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Cannot reset counter while students exist in database",
        message: "Please delete all students first before resetting the counter",
        currentStudentCount: studentCount,
        instruction: "You can delete all students using MongoDB Compass or run: db.students.deleteMany({})"
      });
    }

    // Reset the counter to 0
    const result = await Counter.findByIdAndUpdate(
      { _id: "studentID" },
      { sequenceValue: 0 },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Student ID counter has been reset successfully",
      newCounterValue: result.sequenceValue,
      info: "Next student will receive ID: SGS0001"
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// POST force reset counter (WARNING: Use with caution in development only)
router.post("/force-reset", async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    
    // Reset the counter to 0
    const result = await Counter.findByIdAndUpdate(
      { _id: "studentID" },
      { sequenceValue: 0 },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Student ID counter has been FORCE RESET",
      warning: studentCount > 0 
        ? `WARNING: ${studentCount} students still exist in database with old IDs. This may cause conflicts!`
        : "Counter reset successfully",
      newCounterValue: result.sequenceValue,
      studentsInDatabase: studentCount,
      info: "Next student will receive ID: SGS0001",
      recommendation: studentCount > 0 
        ? "Consider deleting all students first to avoid ID conflicts"
        : null
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
