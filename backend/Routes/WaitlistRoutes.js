const express = require("express");
const router = express.Router();
const {
  joinWaitlist,
  getStudentWaitlist,
  cancelWaitlist,
  checkAvailability,
  getAllWaitlists,
  notifyNext
} = require("../Controllers/WaitlistController");

// Join waitlist for a specific bus
router.post("/join", joinWaitlist);

// Get student's waitlist entries
router.get("/student/:studentID", getStudentWaitlist);

// Cancel waitlist entry
router.delete("/:waitlistID", cancelWaitlist);

// Check if seats are available for a bus (used by frontend)
router.get("/check-availability/:busID", checkAvailability);

// Admin routes for waitlist management
router.get("/admin/all", getAllWaitlists);

// Notify next person in waitlist when seat becomes available
router.post("/notify-next/:busID", notifyNext);

module.exports = router;