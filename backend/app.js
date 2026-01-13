require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
const seatRoutes = require("./Routes/SeatRoutes");
const reservationRoutes = require("./Routes/ReservationRoutes");
const adminRoutes = require("./Routes/AdminRoutes");
const routeRoutes = require("./Routes/RouteRoutes");
const busRoutes = require("./Routes/BusRoutes");
const expiredReservationRoutes = require("./Routes/ExpiredReservationRoutes");
const waitlistRoutes = require("./Routes/WaitlistRoutes");
const reportRoutes = require("./Routes/ReportRoutes");
const studentRoutes = require("./Routes/StudentRoutes");
const counterRoutes = require("./Routes/CounterRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

// Routes
app.use("/api/seats", seatRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/expired-reservations", expiredReservationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/counter", counterRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("School Bus Seat Reservation API is running");
});

// Automatic expired reservation cleanup
const Reservation = require("./Model/ReservationModel");
const Seat = require("./Model/SeatModel");
const Waitlist = require("./Model/WaitlistModel");

// Schedule automatic cleanup every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running automatic expired reservation cleanup...');
        
        const currentDate = new Date();
        const expiredReservations = await Reservation.find({
            status: "Booked",
            endDate: { $lt: currentDate }
        });

        let releasedSeats = 0;
        let pendingSeats = 0;
        
        for (const reservation of expiredReservations) {
            // Update reservation status
            reservation.status = "Completed";
            await reservation.save();

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

        console.log(`Cleanup completed: ${expiredReservations.length} reservations processed`);
        console.log(`- ${releasedSeats} temporary seats released to Available`);
        console.log(`- ${pendingSeats} regular seats set to Pending for renewal`);

        // Check for newly available seats and notify waitlist
        if (releasedSeats > 0) {
            console.log('Checking waitlists for newly available seats...');
            await checkAndNotifyWaitlists();
        }
    } catch (error) {
        console.error('Error during automatic cleanup:', error.message);
    }
});

// Function to check and notify waitlists when seats become available
async function checkAndNotifyWaitlists() {
    try {
        // Get all buses with available seats
        const availableSeats = await Seat.aggregate([
            { $match: { status: "Available" } },
            { $group: { _id: "$busID", availableCount: { $sum: 1 } } }
        ]);

        for (const seat of availableSeats) {
            const { _id: busID, availableCount } = seat;
            
            // Find next person in waitlist for this bus
            const nextInLine = await Waitlist.findOne({
                busID,
                status: "Waiting"
            }).sort({ priority: 1 });

            if (nextInLine) {
                // Update status to notified
                nextInLine.status = "Notified";
                nextInLine.notifiedAt = new Date();
                // Give them 48 hours to respond
                nextInLine.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
                
                await nextInLine.save();
                
                console.log(`Notified student ${nextInLine.studentID} for bus ${busID} - Waitlist ID: ${nextInLine.waitlistID}`);
            }
        }
    } catch (error) {
        console.error('Error checking waitlists:', error.message);
    }
}

// Schedule waitlist cleanup every day at 1 AM
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('Running waitlist cleanup...');
        
        const currentDate = new Date();
        
        // Find expired waitlist entries
        const expiredEntries = await Waitlist.find({
            status: { $in: ["Waiting", "Notified"] },
            expiresAt: { $lt: currentDate }
        });

        let expiredCount = 0;
        
        for (const entry of expiredEntries) {
            entry.status = "Expired";
            await entry.save();
            expiredCount++;
            
            // Update priorities for remaining entries
            await Waitlist.updateMany(
                {
                    busID: entry.busID,
                    status: { $in: ["Waiting", "Notified"] },
                    priority: { $gt: entry.priority }
                },
                { $inc: { priority: -1 } }
            );
        }

        console.log(`Waitlist cleanup completed: ${expiredCount} entries expired`);
        
        // After cleanup, check if we can notify next people in line
        if (expiredCount > 0) {
            await checkAndNotifyWaitlists();
        }
        
    } catch (error) {
        console.error('Error during waitlist cleanup:', error.message);
    }
});

// Schedule reminder check every day at 9 AM for reservations expiring today
cron.schedule('0 9 * * *', async () => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const expiringToday = await Reservation.find({
            status: "Booked",
            endDate: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });

        if (expiringToday.length > 0) {
            console.log(`Reminder: ${expiringToday.length} reservations expire today`);
            expiringToday.forEach(r => {
                console.log(`- ${r.reservationID} (${r.studentID}) - Bus ${r.busID}, Seat ${r.seatNumber}`);
            });
        }
    } catch (error) {
        console.error('Error during expiration reminder check:', error.message);
    }
});

// ⚠️ DISABLED: Automatic pending seat expiry check
// Admin will manually manage seat renewals - Students can renew at any time
// Schedule pending seat expiry check every day at 2 AM
/*
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('Running pending seat expiry check...');
        
        const currentDate = new Date();
        let expiredSeats = 0;
        
        // Find all pending seats
        const pendingSeats = await Seat.find({ status: "Pending" });
        
        for (const seat of pendingSeats) {
            // Find the last completed reservation for this seat by the current reserved student
            const lastReservation = await Reservation.findOne({
                busID: seat.busID,
                seatNumber: seat.seatNumber,
                studentID: seat.reservedBy,
                status: "Completed",
                reservationType: "Regular"
            }).sort({ endDate: -1 });
            
            if (lastReservation) {
                // Calculate days since expiry
                const daysSinceExpiry = Math.floor((currentDate - new Date(lastReservation.endDate)) / (1000 * 60 * 60 * 24));
                
                // Determine grace period based on last subscription type
                let gracePeriod = 7; // Default for monthly (7 days)
                if (lastReservation.seasonType === "SixMonth") {
                    gracePeriod = 12; // 6-month plan gets 12 days
                }
                
                // If grace period exceeded, release the seat
                if (daysSinceExpiry > gracePeriod) {
                    seat.status = "Available";
                    seat.reservedBy = undefined;
                    await seat.save();
                    expiredSeats++;
                    
                    console.log(`Released pending seat ${seat.seatNumber} on bus ${seat.busID} - Grace period (${gracePeriod} days) expired for ${lastReservation.seasonType} plan student ${seat.reservedBy}`);
                }
            } else {
                // If no previous reservation found (shouldn't happen), release the seat
                seat.status = "Available";
                seat.reservedBy = undefined;
                await seat.save();
                expiredSeats++;
                console.log(`Released orphaned pending seat ${seat.seatNumber} on bus ${seat.busID} - No previous reservation found`);
            }
        }
        
        console.log(`Pending seat expiry check completed: ${expiredSeats} seats released to Available`);
        
        // Check for newly available seats and notify waitlist
        if (expiredSeats > 0) {
            console.log('Checking waitlists for newly released seats...');
            await checkAndNotifyWaitlists();
        }
        
    } catch (error) {
        console.error('Error during pending seat expiry check:', error.message);
    }
});
*/

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Automatic seat management system activated:');
    console.log('- Daily cleanup at midnight (00:00) - Process expired reservations');
    console.log('- Daily waitlist cleanup at 1:00 AM - Clean expired waitlist entries');
    console.log('- Daily expiration reminders at 9:00 AM - Log expiring reservations');
    console.log('- Automatic waitlist notifications when seats become available');
    console.log('⚠️  Pending seat auto-release DISABLED - Admin manages renewals manually');
    console.log('   Students can renew their seats at any time, regardless of expiry date');
});
