const Student = require("../Model/StudentModel");
const Counter = require("../Model/CounterModel");
const bcrypt = require("bcrypt");

// Function to generate next Student ID
const generateStudentID = async () => {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "studentID" },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    
    const sequenceNumber = counter.sequenceValue.toString().padStart(4, '0');
    return `SGS${sequenceNumber}`;
  } catch (error) {
    throw new Error("Error generating Student ID");
  }
};

// Register a new student
const registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      grade,
      studentType,
      parentName,
      parentPhone,
      emergencyContact,
      password
    } = req.body;

    // Validate required fields (studentID is now auto-generated)
    if (!name || !email || !phone || !address || !grade || 
        !studentType || !parentName || !parentPhone || !emergencyContact || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid email address" 
      });
    }

    // Validate student type
    if (!["Regular", "Temporary"].includes(studentType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Student type must be either Regular or Temporary" 
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // Generate unique Student ID
    const studentID = await generateStudentID();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student
    const newStudent = new Student({
      studentID,
      name,
      email,
      phone,
      address,
      grade,
      studentType,
      parentName,
      parentPhone,
      emergencyContact,
      password: hashedPassword,
      status: "Active"
    });

    await newStudent.save();

    res.status(201).json({ 
      success: true, 
      message: "Student registered successfully",
      student: {
        studentID: newStudent.studentID,
        name: newStudent.name,
        email: newStudent.email
      }
    });

  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error registering student", 
      error: error.message 
    });
  }
};

// Login student
const loginStudent = async (req, res) => {
  try {
    const { studentID, password } = req.body;

    // Validate input
    if (!studentID || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Student ID and password are required" 
      });
    }

    // Find student
    const student = await Student.findOne({ studentID });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    // Check if student is active
    if (student.status !== "Active") {
      return res.status(403).json({ 
        success: false, 
        message: `Account is ${student.status}. Please contact administration.` 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }

    // Return student data (excluding password)
    res.status(200).json({ 
      success: true, 
      message: "Login successful",
      student: {
        studentID: student.studentID,
        name: student.name,
        email: student.email,
        phone: student.phone,
        grade: student.grade,
        studentType: student.studentType,
        status: student.status
      }
    });

  } catch (error) {
    console.error("Error logging in student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error logging in", 
      error: error.message 
    });
  }
};

// Get student by ID
const getStudentByID = async (req, res) => {
  try {
    const { studentID } = req.params;

    const student = await Student.findOne({ studentID }).select("-password");

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      student 
    });

  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching student", 
      error: error.message 
    });
  }
};

// Update student profile
const updateStudent = async (req, res) => {
  try {
    const { studentID } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.studentID;
    delete updates.password;
    delete updates.createdAt;

    const student = await Student.findOneAndUpdate(
      { studentID },
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      student 
    });

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating profile", 
      error: error.message 
    });
  }
};

// Convert temporary student to regular student
const convertToRegular = async (req, res) => {
  try {
    const { studentID } = req.params;
    
    const Reservation = require("../Model/ReservationModel");
    const Seat = require("../Model/SeatModel");

    // Find the student
    const student = await Student.findOne({ studentID });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    // Check if already regular
    if (student.studentType === "Regular") {
      return res.status(400).json({ 
        success: false, 
        message: "Student is already a regular student" 
      });
    }

    // Find and cancel any active temporary bookings
    const activeReservations = await Reservation.find({
      studentID: studentID,
      status: { $in: ["Booked", "Reserved", "Pending"] }
    });

    // Cancel all active reservations and free up seats
    for (const reservation of activeReservations) {
      reservation.status = "Cancelled";
      reservation.paymentStatus = "Refunded";
      await reservation.save();

      // Free up the seat
      const seat = await Seat.findOne({
        busID: reservation.busID,
        seatNumber: reservation.seatNumber
      });

      if (seat) {
        seat.status = "Available";
        seat.reservedBy = null;
        await seat.save();
      }
    }

    // Update student type to Regular
    student.studentType = "Regular";
    await student.save();

    res.status(200).json({ 
      success: true, 
      message: `Successfully converted to Regular student. ${activeReservations.length} temporary booking(s) cancelled.`,
      student,
      cancelledBookings: activeReservations.length
    });

  } catch (error) {
    console.error("Error converting to regular student:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error converting to regular student", 
      error: error.message 
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  getStudentByID,
  updateStudent,
  convertToRegular
};
