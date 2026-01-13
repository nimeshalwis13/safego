const Bus = require("../Model/BusModel");
const Route = require("../Model/RouteModel");
const Seat = require("../Model/SeatModel");

// Create a new bus with route assignment
exports.createBus = async (req, res) => {
  try {
    const { busID, busNumber, driverName, driverContact, totalSeats, routeId } = req.body;
    const adminUsername = req.admin.username; // From auth middleware

    // Validate required fields
    if (!busID || !busNumber || !driverName || !driverContact || !routeId) {
      return res.status(400).json({ 
        error: "All fields are required: busID, busNumber, driverName, driverContact, routeId" 
      });
    }

    // Check if route exists and is active
    const route = await Route.findOne({ id: routeId, isActive: true });
    if (!route) {
      return res.status(400).json({ error: "Invalid or inactive route selected" });
    }

    // Check if bus ID already exists
    const existingBus = await Bus.findOne({ busID });
    if (existingBus) {
      return res.status(400).json({ error: "Bus ID already exists" });
    }

    // Check if bus number already exists
    const existingBusNumber = await Bus.findOne({ busNumber });
    if (existingBusNumber) {
      return res.status(400).json({ error: "Bus number already exists" });
    }

    // Create new bus
    const newBus = new Bus({
      busID,
      busNumber,
      driverName,
      driverContact,
      totalSeats: totalSeats || 28,
      routeId,
      createdBy: adminUsername
    });

    await newBus.save();

    // Optionally auto-generate seats for the bus
    if (req.body.generateSeats !== false) {
      const seats = Array.from({ length: newBus.totalSeats }, (_, i) => ({
        seatNumber: i + 1,
        busID: newBus.busID,
        status: "Available",
      }));

      await Seat.insertMany(seats);
    }

    // Populate route information in response
    const busWithRoute = await Bus.findById(newBus._id);
    const routeInfo = await Route.findOne({ id: busWithRoute.routeId });

    res.status(201).json({
      message: "Bus created successfully",
      bus: {
        ...busWithRoute.toObject(),
        route: routeInfo
      }
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    res.status(500).json({ error: "Failed to create bus" });
  }
};

// Get all buses with their route information
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Populate route information for each bus
    const busesWithRoutes = await Promise.all(
      buses.map(async (bus) => {
        const route = await Route.findOne({ id: bus.routeId });
        return {
          ...bus.toObject(),
          route: route || null
        };
      })
    );

    res.json({ buses: busesWithRoutes });
  } catch (error) {
    console.error("Error fetching buses:", error);
    res.status(500).json({ error: "Failed to fetch buses" });
  }
};

// Get bus by ID with route and seat information
exports.getBusById = async (req, res) => {
  try {
    const { busID } = req.params;
    const bus = await Bus.findOne({ busID, isActive: true });
    
    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }

    // Get route information
    const route = await Route.findOne({ id: bus.routeId });
    
    // Get seat information
    const seats = await Seat.find({ busID }).sort({ seatNumber: 1 });

    res.json({ 
      bus: {
        ...bus.toObject(),
        route: route || null,
        seats: seats
      }
    });
  } catch (error) {
    console.error("Error fetching bus:", error);
    res.status(500).json({ error: "Failed to fetch bus" });
  }
};

// Update bus information including route assignment
exports.updateBus = async (req, res) => {
  try {
    const { busID } = req.params;
    const { busNumber, driverName, driverContact, totalSeats, routeId, status } = req.body;

    const bus = await Bus.findOne({ busID });
    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }

    // If route is being changed, validate the new route
    if (routeId && routeId !== bus.routeId) {
      const route = await Route.findOne({ id: routeId, isActive: true });
      if (!route) {
        return res.status(400).json({ error: "Invalid or inactive route selected" });
      }
    }

    // Update fields
    if (busNumber) bus.busNumber = busNumber;
    if (driverName) bus.driverName = driverName;
    if (driverContact) bus.driverContact = driverContact;
    if (totalSeats) bus.totalSeats = totalSeats;
    if (routeId) bus.routeId = routeId;
    if (status) bus.status = status;

    await bus.save();

    // Get updated bus with route information
    const route = await Route.findOne({ id: bus.routeId });

    res.json({
      message: "Bus updated successfully",
      bus: {
        ...bus.toObject(),
        route: route || null
      }
    });
  } catch (error) {
    console.error("Error updating bus:", error);
    res.status(500).json({ error: "Failed to update bus" });
  }
};

// Delete bus (soft delete) with seat cleanup
exports.deleteBus = async (req, res) => {
  try {
    const { busID } = req.params;

    const bus = await Bus.findOne({ busID });
    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }

    //  Check if bus has active reservations before deletion
    const Reservation = require("../Model/ReservationModel");
    const activeReservations = await Reservation.countDocuments({
      busID: busID,
      status: { $in: ["Booked", "Reserved", "Pending"] }
    });

    if (activeReservations > 0) {
      return res.status(400).json({ 
        error: `Cannot delete bus. ${activeReservations} active reservation(s) found. Please cancel all bookings first.`
      });
    }

    //  Delete all seats associated with this bus
    const seatsDeleted = await Seat.deleteMany({ busID: busID });
    console.log(`🗑️ Deleted ${seatsDeleted.deletedCount} seats for bus ${busID}`);

    //  Soft delete the bus
    bus.isActive = false;
    await bus.save();

    //  Alternative: Hard delete (if preferred)
    // await Bus.deleteOne({ busID });

    res.json({ 
      message: "Bus deleted successfully",
      details: {
        busID: busID,
        seatsDeleted: seatsDeleted.deletedCount,
        activeReservationsCancelled: 0
      }
    });
  } catch (error) {
    console.error("Error deleting bus:", error);
    res.status(500).json({ error: "Failed to delete bus" });
  }
};

// Get buses by route
exports.getBusesByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate route exists
    const route = await Route.findOne({ id: routeId, isActive: true });
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    const buses = await Bus.find({ routeId, isActive: true }).sort({ createdAt: -1 });
    
    res.json({ 
      route: route,
      buses: buses 
    });
  } catch (error) {
    console.error("Error fetching buses by route:", error);
    res.status(500).json({ error: "Failed to fetch buses for route" });
  }
};