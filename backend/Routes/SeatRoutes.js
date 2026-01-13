const express = require("express");
const router = express.Router();
const { createSeat, getSeatsByBus, generateSeatsForBus, getAllBookings, removeBooking } =
  require("../Controllers/SeatController");

router.post("/", createSeat);                 // create one seat
router.post("/generate", generateSeatsForBus); // bulk create seats
router.get("/bus/:busID", getSeatsByBus);      // list seats by bus
router.get("/all-bookings", getAllBookings);   // get all bookings with student details
router.delete("/remove-booking", removeBooking); // remove/cancel a booking (admin)

module.exports = router;
