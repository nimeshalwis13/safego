const Seat = require("../Model/SeatModel");
const Bus = require("../Model/BusModel");
const Student = require("../Model/StudentModel");
const Reservation = require("../Model/ReservationModel");

// POST /api/seats -> create one seat
const createSeat = async (req, res) => {
  try {
    const { seatNumber, busID, status } = req.body;
    
    // Validate bus exists
    const bus = await Bus.findOne({ busID, isActive: true });
    if (!bus) {
      return res.status(400).json({ error: "Bus not found or inactive" });
    }
    
    const seat = new Seat({
      seatNumber,
      busID,
      status: status || "Available",
    });
    await seat.save();
    res.status(201).json(seat);
  } catch (err) {
    // Duplicate seat for same bus -> E11000
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Seat already exists for this bus." });
    }
    res.status(400).json({ error: err.message });
  }
};

// GET /api/seats/bus/:busID  → list seats of a bus
const getSeatsByBus = async (req, res) => {
  try {
    const seats = await Seat.find({ busID: req.params.busID }).sort("seatNumber");
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/seats/generate  → bulk create seats (1..totalSeats), no driver seat
const generateSeatsForBus = async (req, res) => {
  try {
    const { busID, totalSeats } = req.body;

    // For testing: allow generating seats even if bus doesn't exist in Bus collection
    // In production, you'd want to validate bus existence
    const seatsToGenerate = totalSeats || 28; // default to 28 seats

    const existing = await Seat.countDocuments({ busID });
    if (existing > 0) {
      return res.status(400).json({ message: `Seats already exist for bus ${busID}.` });
    }

    const seats = Array.from({ length: seatsToGenerate }, (_, i) => ({
      seatNumber: i + 1,
      busID,
      status: "Available",
    }));

    const created = await Seat.insertMany(seats);
    res.status(201).json({
      message: `${created.length} seats created for bus ${busID}`,
      busInfo: {
        busID: busID,
        totalSeats: seatsToGenerate
      },
      createdSeats: created,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Some seats already exist for this bus." });
    }
    res.status(400).json({ error: err.message });
  }
};

// GET /api/seats/all-bookings → get all booked/pending seats with student details
const getAllBookings = async (req, res) => {
  try {
    // Find all seats that are either Booked or Pending
    const bookedSeats = await Seat.find({ 
      status: { $in: ["Booked", "Pending"] },
      reservedBy: { $ne: null }
    }).sort({ busID: 1, seatNumber: 1 });

    // Get student details for each booking
    const bookingsWithDetails = await Promise.all(
      bookedSeats.map(async (seat) => {
        const student = await Student.findOne({ studentID: seat.reservedBy });
        
        return {
          busID: seat.busID,
          seatNumber: seat.seatNumber,
          status: seat.status,
          reservedBy: seat.reservedBy,
          studentName: student ? student.name : 'Unknown',
          studentType: student ? student.studentType : 'Unknown',
          phone: student ? student.phone : null,
          parentPhone: student ? student.parentPhone : null,
          email: student ? student.email : null,
          grade: student ? student.grade : null
        };
      })
    );

    res.json(bookingsWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/seats/remove-booking → remove/cancel a booking (admin action)
const removeBooking = async (req, res) => {
  try {
    const { busID, seatNumber } = req.body;

    if (!busID || !seatNumber) {
      return res.status(400).json({ error: "busID and seatNumber are required" });
    }

    // Find the seat
    const seat = await Seat.findOne({ busID, seatNumber });
    
    if (!seat) {
      return res.status(404).json({ error: "Seat not found" });
    }

    if (seat.status === "Available") {
      return res.status(400).json({ error: "Seat is already available (not booked)" });
    }

    // Get student info before removing (for logging/response)
    const studentID = seat.reservedBy;
    const student = await Student.findOne({ studentID });

    
    // Find and cancel the active reservation for this seat
    const activeReservation = await Reservation.findOne({
      busID,
      seatNumber,
      studentID,
      status: { $in: ["Booked", "Reserved", "Pending"] } // Any active status
    }).sort({ createdAt: -1 }); // Get the most recent reservation

    if (activeReservation) {
      activeReservation.status = "Cancelled";
      activeReservation.paymentStatus = "Failed"; // Mark payment as failed (admin removed)
      await activeReservation.save();
      
      console.log(`✅ Reservation ${activeReservation.reservationID} cancelled by admin for student ${studentID}`);
    } else {
      console.warn(`⚠️ No active reservation found for Bus ${busID}, Seat ${seatNumber}, Student ${studentID}`);
    }

    // Release the seat - make it available
    seat.status = "Available";
    seat.reservedBy = null;
    await seat.save();

    res.json({
      success: true,
      message: `Booking removed successfully. Seat ${seatNumber} on bus ${busID} is now available.`,
      releasedSeat: {
        busID,
        seatNumber,
        previousStudent: studentID,
        studentName: student ? student.name : 'Unknown'
      },
      reservationCancelled: activeReservation ? {
        reservationID: activeReservation.reservationID,
        status: "Cancelled"
      } : null
    });
  } catch (err) {
    console.error("Error removing booking:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createSeat, getSeatsByBus, generateSeatsForBus, getAllBookings, removeBooking };
