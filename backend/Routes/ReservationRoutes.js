const express = require("express");
const router = express.Router();
const {
  createReservation,
  getReservationsByStudent,
  updateReservationStatus
} = require("../Controllers/ReservationController");

// Import models for custom routes
const Reservation = require("../Model/ReservationModel");
const Bus = require("../Model/BusModel");
const Student = require("../Model/StudentModel");
const Seat = require("../Model/SeatModel");

// Create new reservation (using embedded logic for compatibility)
router.post("/", async (req, res) => {
  try {
    const {
      studentID,
      busID,
      seatNumber,
      reservationType,
      startDate,
      endDate,
      daysBooked,
      seasonType,
    } = req.body;

    // Check if bus exists in the Bus collection
    let bus = await Bus.findOne({ busID: busID });
    if (!bus) {
      // Create a minimal bus entry if not found in database
      bus = {
        _id: busID,
        busID: busID,
        busNumber: `Bus ${busID}`,
        totalSeats: 28
      };
      console.log(`Using default bus data for: ${busID}`);
    }
    
    // Check if seat exists and is available (using separate Seat collection)
    const seat = await Seat.findOne({ 
      busID: busID, 
      seatNumber: parseInt(seatNumber) 
    });
    
    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }
    
    // Check seat availability
    if (seat.status === "Available") {
      // Seat is available for anyone
    } else if (seat.status === "Pending" && reservationType === "Regular") {
      // Check if this student can renew their previous seat
      const lastReservation = await Reservation.findOne({
        busID,
        seatNumber: parseInt(seatNumber),
        studentID,
        status: "Completed",
        reservationType: "Regular"
      }).sort({ endDate: -1 });
      
      if (!lastReservation) {
        return res.status(400).json({ 
          message: "This seat is pending renewal by another student" 
        });
      }
      
      // ✅ REMOVED: Grace period check - Students can renew at any time
      // Admin will manually manage old/invalid reservations
    } else {
      return res.status(400).json({ message: "Seat not available" });
    }

    // Check if student already has an active reservation (prevent multiple bookings)
    const existingReservation = await Reservation.findOne({
      studentID: studentID,
      status: { $in: ["Booked", "Reserved"] }
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: `Student ${studentID} already has an active reservation (${existingReservation.reservationID}) for Bus ${existingReservation.busID}, Seat ${existingReservation.seatNumber}. Only one active reservation per student is allowed.`,
        existingReservation: {
          reservationID: existingReservation.reservationID,
          busID: existingReservation.busID,
          seatNumber: existingReservation.seatNumber,
          status: existingReservation.status,
          startDate: existingReservation.startDate,
          endDate: existingReservation.endDate
        }
      });
    }

    // Get or create student info
    let student = await Student.findOne({ studentID: studentID });
    
    // If student doesn't exist, create a default student record
    if (!student) {
      student = new Student({
        studentID: studentID,
        name: `Student ${studentID}`,
        email: `${studentID}@school.edu`,
        phone: "0771234567",
        address: "Student Address",
        grade: "N/A",
        parentName: "Parent Name",
        parentPhone: "0771234567",
        emergencyContact: "0771234567",
        status: "Active"
      });
      await student.save();
      console.log(`Created default student record: ${studentID}`);
    }

    // Calculate fees based on student type
    let feeAmount = 0;
    let feeBreakdown = {
      registrationFee: 0,
      monthlyFee: 0,
      annualFee: 0,
      dailyFee: 0,
    };

    if (reservationType === "Regular") {
      const hasExistingReservation = await Reservation.findOne({
        studentID: studentID, // Use actual student ID string instead of ObjectId
        paymentStatus: "Success",
      });

      if (seasonType === "SixMonth") { // Updated from "Annual" to "SixMonth"
        feeBreakdown.annualFee = 20000; // Updated 6-month fee (no registration fee)
        feeAmount = 20000;
      } else if (seasonType === "Monthly") {
        feeBreakdown.monthlyFee = 4000; // Updated monthly fee
        feeAmount = 4000;

        if (!hasExistingReservation) {
          feeBreakdown.registrationFee = 500; // Registration fee for new students
          feeAmount += 500;
        }
      }
    } else if (reservationType === "Temporary") {
      // Validate days booking limit for temporary students (maximum 14 days)
      if (daysBooked > 14) {
        return res.status(400).json({ 
          message: "Temporary student bookings are limited to a maximum of 14 days (2 weeks)" 
        });
      }
      
      feeBreakdown.dailyFee = 200;
      feeAmount = 200 * daysBooked;
    }

    // Calculate proper end date and days for regular students
    let finalEndDate = endDate;
    let finalDaysBooked = daysBooked;
    
    if (reservationType === "Regular") {
      const startDateObj = new Date(startDate);
      
      if (seasonType === "Monthly") {
        // Monthly plan: 30 days from start date
        finalEndDate = new Date(startDateObj);
        finalEndDate.setDate(finalEndDate.getDate() + 30);
        finalDaysBooked = 30;
      } else if (seasonType === "SixMonth") {
        // 6-month plan: 180 days from start date
        finalEndDate = new Date(startDateObj);
        finalEndDate.setDate(finalEndDate.getDate() + 180);
        finalDaysBooked = 180;
      }
    }

    // Create reservation
    const reservation = new Reservation({
      studentID: studentID, // Use the actual student ID string like "SGS0001"
      busID: busID, // Use string busID like "BUS001"
      seatNumber: parseInt(seatNumber),
      reservationType,
      startDate,
      endDate: finalEndDate,
      daysBooked: finalDaysBooked,
      seasonType,
      feeAmount,
      feeBreakdown,
    });

    await reservation.save();

    // Reserve the seat temporarily (update the separate Seat document)
    seat.status = "Pending"; // Use "Pending" instead of "Reserved"
    seat.reservedBy = student.studentID; // Use studentID string instead of ObjectId
    await seat.save();

    res.status(201).json(reservation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update payment status (using controller)
router.put("/:id/payment", updateReservationStatus);

// Cancel reservation (for students)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find the reservation
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Only allow cancellation of Booked or Reserved reservations
    if (!["Booked", "Reserved"].includes(reservation.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel reservation with status: ${reservation.status}` 
      });
    }

    // Update reservation status to Cancelled
    reservation.status = "Cancelled";
    reservation.paymentStatus = "Failed"; // Use "Failed" instead of "Refunded" (valid enum value)
    await reservation.save();

    // Find the seat and update its status
    const seat = await Seat.findOne({
      busID: reservation.busID,
      seatNumber: reservation.seatNumber
    });

    if (seat) {
      // Check if this was a regular student's seat (should be set to Pending for renewal)
      const wasRegularStudent = reservation.reservationType === "Regular";
      
      // Check if there's a completed reservation by this student for this seat
      const hasCompletedReservation = await Reservation.findOne({
        busID: reservation.busID,
        seatNumber: reservation.seatNumber,
        studentID: reservation.studentID,
        status: "Completed",
        reservationType: "Regular"
      });

      // If regular student with history, set to Pending, otherwise Available
      if (wasRegularStudent && hasCompletedReservation) {
        seat.status = "Pending";
        seat.reservedBy = reservation.studentID;
      } else {
        seat.status = "Available";
        seat.reservedBy = null;
      }
      
      await seat.save();
    }

    res.json({ 
      success: true,
      message: "Reservation cancelled successfully", 
      reservation 
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get reservations by student ID (using controller)
router.get("/student/:studentID", getReservationsByStudent);

module.exports = router;
