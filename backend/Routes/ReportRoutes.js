const express = require('express');
const router = express.Router();
const Reservation = require('../Model/ReservationModel');
const Bus = require('../Model/BusModel');
const Seat = require('../Model/SeatModel');
const Waitlist = require('../Model/WaitlistModel');

// 1. Seat Usage Report
router.get('/seat-usage', async (req, res) => {
  try {
    const buses = await Bus.find();
    const reportData = [];

    for (const bus of buses) {
      const totalSeats = 28; // Standard bus capacity
      const bookedSeats = await Seat.countDocuments({ 
        busID: bus.busID, 
        status: 'Booked' 
      });
      const pendingSeats = await Seat.countDocuments({ 
        busID: bus.busID, 
        status: 'Pending' 
      });
      const availableSeats = totalSeats - bookedSeats - pendingSeats;
      const utilizationRate = ((bookedSeats / totalSeats) * 100).toFixed(1);

      reportData.push({
        busID: bus.busID,
        busNumber: bus.busNumber,
        driverName: bus.driverName || 'Not Assigned',
        totalSeats,
        bookedSeats,
        pendingSeats,
        availableSeats,
        utilizationRate: `${utilizationRate}%`
      });
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Reservation Summary Report
router.get('/reservation-summary', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    
    const summary = {
      totalReservations: reservations.length,
      regularStudents: reservations.filter(r => r.reservationType === 'Regular').length,
      temporaryStudents: reservations.filter(r => r.reservationType === 'Temporary').length,
      bookedReservations: reservations.filter(r => r.status === 'Booked').length,
      pendingReservations: reservations.filter(r => r.status === 'Pending').length,
      cancelledReservations: reservations.filter(r => r.status === 'Cancelled').length
    };

    const recentReservations = reservations.slice(0, 20).map(r => ({
      reservationID: r.reservationID,
      studentID: r.studentID,
      busID: r.busID,
      seatNumber: r.seatNumber,
      type: r.reservationType,
      status: r.status,
      amount: `LKR ${r.feeAmount}`,
      daysBooked: r.daysBooked || (r.reservationType === 'Regular' ? (r.seasonType === 'SixMonth' ? '180' : '30') : '1'),
      date: new Date(r.createdAt).toLocaleDateString()
    }));

    res.json({ 
      success: true, 
      summary, 
      recentReservations 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Revenue Report
router.get('/revenue', async (req, res) => {
  try {
    const paidReservations = await Reservation.find({ 
      paymentStatus: 'Success' 
    });

    const totalRevenue = paidReservations.reduce((sum, r) => sum + r.feeAmount, 0);
    const regularRevenue = paidReservations
      .filter(r => r.reservationType === 'Regular')
      .reduce((sum, r) => sum + r.feeAmount, 0);
    const temporaryRevenue = paidReservations
      .filter(r => r.reservationType === 'Temporary')
      .reduce((sum, r) => sum + r.feeAmount, 0);

    const monthlyRevenue = {};
    paidReservations.forEach(r => {
      const month = new Date(r.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + r.feeAmount;
    });

    const revenueByBus = {};
    paidReservations.forEach(r => {
      revenueByBus[r.busID] = (revenueByBus[r.busID] || 0) + r.feeAmount;
    });

    res.json({
      success: true,
      summary: {
        totalRevenue: `LKR ${totalRevenue.toFixed(2)}`,
        regularRevenue: `LKR ${regularRevenue.toFixed(2)}`,
        temporaryRevenue: `LKR ${temporaryRevenue.toFixed(2)}`,
        totalTransactions: paidReservations.length
      },
      monthlyRevenue,
      revenueByBus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Expired & Auto Released Seats Report
router.get('/expired-seats', async (req, res) => {
  try {
    const expiredReservations = await Reservation.find({ 
      status: 'Expired' 
    }).sort({ updatedAt: -1 });

    const expiredData = expiredReservations.map(r => ({
      reservationID: r.reservationID,
      studentID: r.studentID,
      busID: r.busID,
      seatNumber: r.seatNumber,
      type: r.reservationType,
      amount: `LKR ${r.feeAmount}`,
      createdDate: new Date(r.createdAt).toLocaleDateString(),
      expiredDate: new Date(r.updatedAt).toLocaleDateString()
    }));

    const summary = {
      totalExpired: expiredReservations.length,
      regularExpired: expiredReservations.filter(r => r.reservationType === 'Regular').length,
      temporaryExpired: expiredReservations.filter(r => r.reservationType === 'Temporary').length,
      lostRevenue: expiredReservations.reduce((sum, r) => sum + r.feeAmount, 0)
    };

    res.json({
      success: true,
      summary,
      expiredReservations: expiredData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Waitlist Report
router.get('/waitlist', async (req, res) => {
  try {
    const waitlistEntries = await Waitlist.find().sort({ createdAt: -1 });

    const summary = {
      totalWaitlist: waitlistEntries.length,
      waitingEntries: waitlistEntries.filter(w => w.status === 'Waiting').length,
      notifiedEntries: waitlistEntries.filter(w => w.status === 'Notified').length,
      cancelledEntries: waitlistEntries.filter(w => w.status === 'Cancelled').length,
      expiredEntries: waitlistEntries.filter(w => w.status === 'Expired').length
    };

    const waitlistData = waitlistEntries.map(w => ({
      waitlistID: w.waitlistID,
      studentID: w.studentID,
      busID: w.busID,
      type: w.reservationType,
      status: w.status,
      daysRequested: w.daysRequested,
      requestDate: new Date(w.requestedDate).toLocaleDateString(),
      createdDate: new Date(w.createdAt).toLocaleDateString()
    }));

    res.json({
      success: true,
      summary,
      waitlistEntries: waitlistData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;