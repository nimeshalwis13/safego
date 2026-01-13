const Waitlist = require("../Model/WaitlistModel");
const Seat = require("../Model/SeatModel");
const Bus = require("../Model/BusModel");
const Route = require("../Model/RouteModel");

// Join waitlist for a specific bus
const joinWaitlist = async (req, res) => {
  try {
    const {
      studentID,
      busID,
      routeID,
      reservationType,
      requestedDate,
      daysRequested,
      seasonType
    } = req.body;

    // Validate required fields
    if (!studentID || !busID || !routeID || !reservationType || !requestedDate || !daysRequested || !seasonType) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // Check if student is already on waitlist for this bus
    const existingWaitlist = await Waitlist.findOne({
      studentID,
      busID,
      status: { $in: ["Waiting", "Notified"] }
    });

    if (existingWaitlist) {
      return res.status(400).json({
        error: "You are already on the waitlist for this bus"
      });
    }

    // Check if bus exists
    const bus = await Bus.findOne({ busID });
    if (!bus) {
      console.log(`Bus not found: ${busID}. Available buses:`, await Bus.find({}, 'busID busNumber'));
      return res.status(404).json({
        error: "Bus not found",
        busID: busID,
        message: "Please make sure the bus exists in the system"
      });
    }

    // Get current position in waitlist
    const currentWaitlistCount = await Waitlist.countDocuments({
      busID,
      status: { $in: ["Waiting", "Notified"] }
    });

    // Create waitlist entry
    const waitlistEntry = new Waitlist({
      studentID,
      busID,
      routeID,
      reservationType,
      requestedDate: new Date(requestedDate),
      daysRequested,
      seasonType,
      priority: currentWaitlistCount + 1
    });

    await waitlistEntry.save();

    res.status(201).json({
      message: "Successfully joined waitlist",
      waitlist: waitlistEntry,
      position: currentWaitlistCount + 1
    });

  } catch (error) {
    console.error("Error joining waitlist:", error);
    res.status(500).json({
      error: "Failed to join waitlist"
    });
  }
};

// Get student's waitlist entries
const getStudentWaitlist = async (req, res) => {
  try {
    const { studentID } = req.params;

    const waitlistEntries = await Waitlist.find({
      studentID,
      status: { $in: ["Waiting", "Notified"] }
    }).sort({ createdAt: -1 });

    // Get additional details for each entry
    const entriesWithDetails = await Promise.all(
      waitlistEntries.map(async (entry) => {
        const bus = await Bus.findOne({ busID: entry.busID });
        const route = await Route.findOne({ id: entry.routeID });
        
        // Get current position in waitlist
        const position = await Waitlist.countDocuments({
          busID: entry.busID,
          status: { $in: ["Waiting", "Notified"] },
          priority: { $lte: entry.priority }
        });

        return {
          ...entry.toObject(),
          busDetails: bus,
          routeDetails: route,
          currentPosition: position
        };
      })
    );

    res.json({
      waitlistEntries: entriesWithDetails
    });

  } catch (error) {
    console.error("Error fetching student waitlist:", error);
    res.status(500).json({
      error: "Failed to fetch waitlist entries"
    });
  }
};

// Cancel waitlist entry
const cancelWaitlist = async (req, res) => {
  try {
    const { waitlistID } = req.params;
    const { studentID, adminCancel } = req.body;

    let waitlistEntry;
    
    if (adminCancel) {
      // Admin can cancel any entry
      waitlistEntry = await Waitlist.findOne({
        waitlistID,
        status: { $in: ["Waiting", "Notified"] }
      });
    } else {
      // Student can only cancel their own entry
      waitlistEntry = await Waitlist.findOne({
        waitlistID,
        studentID,
        status: { $in: ["Waiting", "Notified"] }
      });
    }

    if (!waitlistEntry) {
      return res.status(404).json({
        error: "Waitlist entry not found or already processed"
      });
    }

    // Update status to cancelled
    waitlistEntry.status = "Cancelled";
    await waitlistEntry.save();

    // Update priorities for remaining entries
    await Waitlist.updateMany(
      {
        busID: waitlistEntry.busID,
        status: { $in: ["Waiting", "Notified"] },
        priority: { $gt: waitlistEntry.priority }
      },
      { $inc: { priority: -1 } }
    );

    res.json({
      message: "Waitlist entry cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling waitlist entry:", error);
    res.status(500).json({
      error: "Failed to cancel waitlist entry"
    });
  }
};

// Check if seats are available for a bus (used by frontend)
const checkAvailability = async (req, res) => {
  try {
    const { busID } = req.params;

    // Get bus details
    const bus = await Bus.findOne({ busID });
    if (!bus) {
      return res.status(404).json({
        error: "Bus not found"
      });
    }

    // Get available seats count
    const availableSeats = await Seat.countDocuments({
      busID,
      status: "Available"
    });

    // Get waitlist count
    const waitlistCount = await Waitlist.countDocuments({
      busID,
      status: { $in: ["Waiting", "Notified"] }
    });

    res.json({
      busID,
      totalSeats: bus.totalSeats,
      availableSeats,
      waitlistCount,
      hasAvailableSeats: availableSeats > 0 // If false, show "Join Waitlist"
    });

  } catch (error) {
    console.error("Error checking seat availability:", error);
    res.status(500).json({
      error: "Failed to check seat availability"
    });
  }
};

// Get all waitlist entries (Admin)
const getAllWaitlists = async (req, res) => {
  try {
    const waitlistEntries = await Waitlist.find({
      status: { $in: ["Waiting", "Notified"] }
    }).sort({ busID: 1, priority: 1 });

    // Group by bus and add details
    const entriesWithDetails = await Promise.all(
      waitlistEntries.map(async (entry) => {
        const bus = await Bus.findOne({ busID: entry.busID });
        const route = await Route.findOne({ id: entry.routeID });
        
        return {
          ...entry.toObject(),
          busDetails: bus,
          routeDetails: route
        };
      })
    );

    res.json({
      waitlistEntries: entriesWithDetails
    });

  } catch (error) {
    console.error("Error fetching all waitlists:", error);
    res.status(500).json({
      error: "Failed to fetch waitlist entries"
    });
  }
};

// Notify next person in waitlist when seat becomes available
const notifyNext = async (req, res) => {
  try {
    const { busID } = req.params;

    // Find next person in waitlist
    const nextInLine = await Waitlist.findOne({
      busID,
      status: "Waiting"
    }).sort({ priority: 1 });

    if (!nextInLine) {
      return res.status(404).json({
        message: "No one waiting for this bus"
      });
    }

    // Update status to notified
    nextInLine.status = "Notified";
    nextInLine.notifiedAt = new Date();
    // Give them 48 hours to respond
    nextInLine.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    await nextInLine.save();

    res.json({
      message: "Next person in waitlist has been notified",
      notifiedEntry: nextInLine
    });

  } catch (error) {
    console.error("Error notifying next in waitlist:", error);
    res.status(500).json({
      error: "Failed to notify next person"
    });
  }
};

module.exports = {
  joinWaitlist,
  getStudentWaitlist,
  cancelWaitlist,
  checkAvailability,
  getAllWaitlists,
  notifyNext
};
