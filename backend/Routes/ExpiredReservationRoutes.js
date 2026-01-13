const express = require("express");
const router = express.Router();
const Reservation = require("../Model/ReservationModel");
const Seat = require("../Model/SeatModel");

// Check and release expired reservations
router.post("/check-expired", async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Find all booked reservations that have expired
    const expiredReservations = await Reservation.find({
      status: "Booked",
      endDate: { $lt: currentDate } // endDate is less than current date
    });

    let releasedSeats = 0;
    let pendingSeats = 0;
    let updatedReservations = 0;

    for (const reservation of expiredReservations) {
      // Update reservation status to completed/expired
      reservation.status = "Completed";
      await reservation.save();
      updatedReservations++;

      // Handle seat status based on reservation type
      const seat = await Seat.findOne({
        busID: reservation.busID,
        seatNumber: reservation.seatNumber
      });

      if (seat && seat.status === "Booked") {
        if (reservation.reservationType === "Temporary") {
          // Temporary students: Release seat immediately
          seat.status = "Available";
          seat.reservedBy = undefined;
          await seat.save();
          releasedSeats++;
          console.log(`Released seat ${seat.seatNumber} on bus ${seat.busID} - Temporary reservation ${reservation.reservationID} expired`);
        } else if (reservation.reservationType === "Regular") {
          // Regular students: Set to Pending for potential renewal
          seat.status = "Pending";
          // Keep reservedBy for renewal tracking
          await seat.save();
          pendingSeats++;
          console.log(`Set seat ${seat.seatNumber} on bus ${seat.busID} to Pending - Regular reservation ${reservation.reservationID} expired`);
        }
      }
    }

    res.json({
      message: `Processed ${expiredReservations.length} expired reservations`,
      releasedSeats: releasedSeats,
      pendingSeats: pendingSeats,
      updatedReservations: updatedReservations,
      expiredReservations: expiredReservations.map(r => ({
        reservationID: r.reservationID,
        studentID: r.studentID,
        busID: r.busID,
        seatNumber: r.seatNumber,
        reservationType: r.reservationType,
        endDate: r.endDate
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Find reservations by student ID
router.get("/find/:studentId", async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      studentID: req.params.studentId 
    }).sort({ createdAt: -1 }); // Latest first

    res.json({
      count: reservations.length,
      reservations: reservations.map(r => ({
        reservationID: r.reservationID,
        _id: r._id,
        studentID: r.studentID,
        busID: r.busID,
        seatNumber: r.seatNumber,
        reservationType: r.reservationType,
        startDate: r.startDate,
        endDate: r.endDate,
        daysBooked: r.daysBooked,
        status: r.status,
        paymentStatus: r.paymentStatus
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all reservations expiring today
router.get("/expiring-today", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const expiringReservations = await Reservation.find({
      status: "Booked",
      endDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    res.json({
      count: expiringReservations.length,
      reservations: expiringReservations.map(r => ({
        reservationID: r.reservationID,
        studentID: r.studentID,
        busID: r.busID,
        seatNumber: r.seatNumber,
        reservationType: r.reservationType,
        endDate: r.endDate
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update reservation end date (force expiration)
router.put("/force-expire/:reservationId", async (req, res) => {
  try {
    const { newEndDate } = req.body; // Expected format: "2025-10-03" (yesterday)
    
    const reservation = await Reservation.findOne({ 
      reservationID: req.params.reservationId 
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const oldEndDate = reservation.endDate;
    reservation.endDate = new Date(newEndDate);
    await reservation.save();

    res.json({
      message: "Reservation end date updated successfully",
      reservationID: reservation.reservationID,
      studentID: reservation.studentID,
      oldEndDate: oldEndDate,
      newEndDate: reservation.endDate,
      status: reservation.status,
      note: "You can now run the expired reservation cleanup to test automatic seat release"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually release specific reservation (for admin use)
router.put("/release/:reservationId", async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ 
      reservationID: req.params.reservationId 
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "Booked") {
      return res.status(400).json({ 
        message: `Reservation is not booked (current status: ${reservation.status})` 
      });
    }

    // Update reservation status
    reservation.status = "Completed";
    await reservation.save();

    // Release seat
    const seat = await Seat.findOne({
      busID: reservation.busID,
      seatNumber: reservation.seatNumber
    });

    if (seat) {
      seat.status = "Available";
      seat.reservedBy = undefined;
      await seat.save();
    }

    res.json({
      message: "Reservation released successfully",
      reservationID: reservation.reservationID,
      seatReleased: !!seat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin dashboard: Get pending seats summary
router.get("/admin/pending-summary", async (req, res) => {
  try {
    const pendingSeats = await Seat.find({ status: "Pending" });
    const Student = require("../Model/StudentModel");
    
    // Group by bus for better organization
    const busSummary = {};
    
    for (const seat of pendingSeats) {
      if (!busSummary[seat.busID]) {
        busSummary[seat.busID] = [];
      }
      
      // Find the most recent completed reservation for this seat
      const lastReservation = await Reservation.findOne({
        busID: seat.busID,
        seatNumber: seat.seatNumber,
        status: "Completed",
        reservationType: "Regular"
      }).sort({ endDate: -1 });
      
      if (lastReservation) {
        const student = await Student.findOne({ 
          studentID: lastReservation.studentID 
        });
        
        const daysExpired = Math.floor((new Date() - new Date(lastReservation.endDate)) / (1000 * 60 * 60 * 24));
        
        busSummary[seat.busID].push({
          seatNumber: seat.seatNumber,
          studentID: lastReservation.studentID,
          studentName: student?.name || "Unknown",
          phone: student?.phone || "N/A",
          parentPhone: student?.parentPhone || "N/A",
          seasonType: lastReservation.seasonType,
          expiredDate: lastReservation.endDate,
          daysExpired: daysExpired,
          priority: daysExpired <= 7 ? "High" : daysExpired <= 14 ? "Medium" : "Low" // Renewal priority
        });
      }
    }
    
    // Calculate totals
    const totalPending = Object.values(busSummary).reduce((sum, seats) => sum + seats.length, 0);
    const highPriority = Object.values(busSummary).flat().filter(s => s.priority === "High").length;
    
    res.json({
      summary: {
        totalPendingSeats: totalPending,
        totalBuses: Object.keys(busSummary).length,
        highPriorityRenewals: highPriority
      },
      busSummary: busSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin action: Contact student for renewal
router.post("/admin/contact-student", async (req, res) => {
  try {
    const { studentID, busID, seatNumber, contactMethod, notes } = req.body;
    
    // ⭐ FETCH ACTUAL STUDENT DETAILS FROM DATABASE
    const Student = require("../Model/StudentModel");
    const student = await Student.findOne({ studentID: studentID });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: `Student ${studentID} not found in database` 
      });
    }
    
    // ⭐ FETCH RESERVATION DETAILS
    const lastReservation = await Reservation.findOne({
      studentID: studentID,
      busID: busID,
      seatNumber: seatNumber,
      status: "Completed",
      reservationType: "Regular"
    }).sort({ endDate: -1 });
    
    if (!lastReservation) {
      return res.status(404).json({
        success: false,
        message: `No completed reservation found for student ${studentID} on Bus ${busID}, Seat ${seatNumber}`
      });
    }
    
    // Calculate days since expiry
    const daysExpired = Math.floor((new Date() - new Date(lastReservation.endDate)) / (1000 * 60 * 60 * 24));
    
    // Log the contact attempt (in a real system, this might send SMS/email)
    console.log(`📞 Admin contacted student ${studentID} (${student.name}) via ${contactMethod} for seat renewal`);
    console.log(`   Bus: ${busID}, Seat: ${seatNumber}, Expired: ${daysExpired} days ago`);
    if (notes) console.log(`   Notes: ${notes}`);
    
    // ⭐ RETURN COMPLETE CONTACT INFORMATION
    res.json({
      success: true,
      message: `Contact logged for student ${student.name}`,
      contactDetails: {
        studentID: student.studentID,
        studentName: student.name,
        phone: student.phone || "Not available",
        email: student.email || "Not available",
        parentName: student.parentName || "Not available",
        parentPhone: student.parentPhone || "Not available",
        emergencyContact: student.emergencyContact || "Not available",
        busID: busID,
        seatNumber: seatNumber,
        contactMethod: contactMethod,
        timestamp: new Date(),
        notes: notes || "",
        reservationInfo: {
          seasonType: lastReservation.seasonType,
          expiredDate: lastReservation.endDate,
          daysExpired: daysExpired,
          priority: daysExpired <= 7 ? "High" : daysExpired <= 14 ? "Medium" : "Low"
        }
      }
    });
  } catch (error) {
    console.error("Error contacting student:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Release pending seats to available (admin function)
router.put("/release-pending-seats", async (req, res) => {
  try {
    const { busID, seatNumbers } = req.body; // Optional filters
    
    let query = { status: "Pending" };
    if (busID) query.busID = busID;
    if (seatNumbers && seatNumbers.length > 0) query.seatNumber = { $in: seatNumbers };
    
    const pendingSeats = await Seat.find(query);
    
    let releasedCount = 0;
    for (const seat of pendingSeats) {
      seat.status = "Available";
      seat.reservedBy = undefined;
      await seat.save();
      releasedCount++;
      console.log(`Released pending seat ${seat.seatNumber} on bus ${seat.busID} to Available`);
    }
    
    res.json({
      message: `Released ${releasedCount} pending seats to available`,
      releasedSeats: pendingSeats.map(s => ({
        busID: s.busID,
        seatNumber: s.seatNumber,
        newStatus: "Available"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all pending seats with student details (for admin dashboard)
router.get("/pending-seats", async (req, res) => {
  try {
    const pendingSeats = await Seat.find({ status: "Pending" });
    const Student = require("../Model/StudentModel");
    
    const seatsWithStudentDetails = [];
    
    for (const seat of pendingSeats) {
      // Find the most recent completed reservation for this seat
      const lastReservation = await Reservation.findOne({
        busID: seat.busID,
        seatNumber: seat.seatNumber,
        status: "Completed",
        reservationType: "Regular"
      }).sort({ endDate: -1 }); // Most recent first
      
      if (lastReservation) {
        // Get student details
        const student = await Student.findOne({ 
          studentID: lastReservation.studentID 
        });
        
        seatsWithStudentDetails.push({
          busID: seat.busID,
          seatNumber: seat.seatNumber,
          status: seat.status,
          reservationDetails: {
            reservationID: lastReservation.reservationID,
            studentID: lastReservation.studentID,
            seasonType: lastReservation.seasonType,
            endDate: lastReservation.endDate,
            daysExpired: Math.floor((new Date() - new Date(lastReservation.endDate)) / (1000 * 60 * 60 * 24))
          },
          studentDetails: student ? {
            name: student.name,
            phone: student.phone,
            email: student.email,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            emergencyContact: student.emergencyContact
          } : {
            name: "Student details not found",
            phone: "N/A",
            email: "N/A"
          }
        });
      }
    }
    
    res.json({
      count: seatsWithStudentDetails.length,
      pendingSeats: seatsWithStudentDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start automatic cleanup every 5 minutes (for testing)
router.post("/start-auto-cleanup", (req, res) => {
  const cron = require("node-cron");
  
  // Schedule cleanup every 5 minutes for testing
  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Running automatic 5-minute cleanup check...');
      
      const currentDate = new Date();
      const expiredReservations = await Reservation.find({
        status: "Booked",
        endDate: { $lt: currentDate }
      });

      let releasedSeats = 0;
      let pendingSeats = 0;
      
      for (const reservation of expiredReservations) {
        reservation.status = "Completed";
        await reservation.save();

        const seat = await Seat.findOne({
          busID: reservation.busID,
          seatNumber: reservation.seatNumber
        });

        if (seat && seat.status === "Booked") {
          if (reservation.reservationType === "Temporary") {
            // Temporary students: Release seat immediately
            seat.status = "Available";
            seat.reservedBy = undefined;
            await seat.save();
            releasedSeats++;
            console.log(`Auto-released seat ${seat.seatNumber} on bus ${seat.busID} - Temporary`);
          } else if (reservation.reservationType === "Regular") {
            // Regular students: Set to Pending for potential renewal
            seat.status = "Pending";
            await seat.save();
            pendingSeats++;
            console.log(`Auto-set seat ${seat.seatNumber} on bus ${seat.busID} to Pending - Regular`);
          }
        }
      }

      if (expiredReservations.length > 0) {
        console.log(`Auto-cleanup: ${expiredReservations.length} reservations processed`);
        console.log(`- ${releasedSeats} temporary seats released, ${pendingSeats} regular seats set to pending`);
      }
    } catch (error) {
      console.error('Auto-cleanup error:', error.message);
    }
  });

  res.json({
    message: "Automatic cleanup started - runs every 5 minutes for testing",
    note: "This is for testing purposes. Production uses daily cleanup at midnight."
  });
});

module.exports = router;