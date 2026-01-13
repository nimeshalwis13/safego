import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSeatsByBus, checkSeatAvailability, joinWaitlist } from "../services/api";
import toast from "react-hot-toast";
import "../styles/seat-map.css";

const SeatMap = ({ busID, studentID, routeID }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [studentHistory, setStudentHistory] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const navigate = useNavigate();

  // Fetch seats and availability info from backend when component loads
  useEffect(() => {
    if (busID) {
      loadSeats();
      loadAvailabilityInfo();
      loadStudentHistory();
      checkActiveReservations();
    }
  }, [busID]);

  const checkActiveReservations = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStudentID = urlParams.get('studentID') || studentID;
      
      if (!urlStudentID) {
        console.warn("No student ID provided");
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/reservations/student/${urlStudentID}`);
      const data = await response.json();
      
      // API returns array directly, not wrapped in { reservations: [...] }
      const allReservations = Array.isArray(data) ? data : (data.reservations || []);
      
      // Check for active reservations (Booked or Reserved status)
      const activeReservations = allReservations.filter(r => 
        r.status === "Booked" || r.status === "Reserved"
      );
      
      if (activeReservations.length > 0) {
        setActiveReservation(activeReservations[0]);
      }
    } catch (error) {
      console.error("Error checking active reservations:", error);
    }
  };

  const loadStudentHistory = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStudentID = urlParams.get('studentID') || studentID;
      const studentType = urlParams.get('type') || 'Regular';
      
      if (!urlStudentID) {
        console.warn("No student ID provided for history");
        return;
      }
      
      if (studentType === 'Regular') {
        const response = await fetch(`http://localhost:5000/api/expired-reservations/find/${urlStudentID}`);
        const data = await response.json();
        setStudentHistory(data.reservations || []);
      }
    } catch (error) {
      console.error("Failed to load student history:", error);
      setStudentHistory([]);
    }
  };

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await getSeatsByBus(busID);
      setSeats(data);
    } catch (error) {
      toast.error("Failed to load seats");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilityInfo = async () => {
    try {
      const info = await checkSeatAvailability(busID);
      setAvailabilityInfo(info);
    } catch (error) {
      console.error("Failed to load availability info:", error);
    }
  };

  // Check if current student can renew a pending seat
  const canRenewSeat = (seat) => {
    if (seat.status !== "Pending") return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const studentType = urlParams.get('type') || 'Regular';
    
    if (studentType !== 'Regular') return false;
    
    // Check if this student had this seat before
    return studentHistory.some(reservation => 
      reservation.busID === busID && 
      reservation.seatNumber === seat.seatNumber && 
      reservation.status === "Completed" &&
      reservation.reservationType === "Regular"
    );
  };

  // Handle seat click - make reservation and redirect to payment
  const handleClick = async (seat) => {
    // Get student type and studentID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentType = urlParams.get('type') || 'Regular';
    const urlStudentID = urlParams.get('studentID') || studentID;
    
    // Validate student ID exists
    if (!urlStudentID) {
      toast.error("Student ID is missing. Please login again.");
      navigate('/student-login');
      return;
    }

    // Check if student already has an active reservation
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/student/${urlStudentID}`);
      const data = await response.json();
      
      // Check for active reservations (Booked or Reserved status)
      const activeReservations = data.reservations?.filter(r => 
        r.status === "Booked" || r.status === "Reserved"
      ) || [];
      
      if (activeReservations.length > 0) {
        const activeRes = activeReservations[0];
        toast.error(
          `You already have an active reservation! Bus ${activeRes.busID}, Seat ${activeRes.seatNumber}. Only one active reservation per student is allowed.`
        );
        return;
      }
    } catch (error) {
      console.error("Error checking existing reservations:", error);
      // Continue with booking if API call fails (don't block user)
    }

    // 🔒 CRITICAL CHECK: If Regular student has pending renewal seat, they can ONLY renew that seat
    if (studentType === 'Regular' && studentHistory.length > 0) {
      // Check if this student has ANY pending renewal seats (on ANY bus)
      const allPendingRenewalSeats = studentHistory.filter(reservation => 
        reservation.status === "Completed" &&
        reservation.reservationType === "Regular"
      );
      
      // For each completed reservation, check if there's a pending seat for it
      for (const completedReservation of allPendingRenewalSeats) {
        try {
          // Check if the seat from this completed reservation is currently pending
          const seatCheckResponse = await fetch(
            `http://localhost:5000/api/seats/bus/${completedReservation.busID}`
          );
          const seatData = await seatCheckResponse.json();
          
          const pendingSeat = seatData.find(s => 
            s.seatNumber === completedReservation.seatNumber && 
            s.status === "Pending" &&
            s.reservedBy === urlStudentID
          );
          
          if (pendingSeat) {
            // Student has a pending renewal seat somewhere
            const isThisSeat = completedReservation.busID === busID && 
                              completedReservation.seatNumber === seat.seatNumber;
            
            if (!isThisSeat) {
              // They're trying to book a different seat/bus
              toast.error(
                `⚠️ You have a pending renewal!\n\nBus ${completedReservation.busID}, Seat ${completedReservation.seatNumber}\n\nYou must renew your previous seat first or contact admin to release it.`,
                { duration: 5000 }
              );
              return;
            }
          }
        } catch (error) {
          console.error("Error checking pending seats:", error);
        }
      }
    }

    if (seat.status === "Available") {
      // Available seat - proceed normally
      toast.success(`Seat ${seat.seatNumber} selected!`);
    } else if (seat.status === "Pending" && studentType === "Regular") {
      // Check if this student can renew this pending seat
      try {
        const response = await fetch(`http://localhost:5000/api/expired-reservations/find/${urlStudentID}`);
        const data = await response.json();
        
        // Check if this student had this seat before
        const hadThisSeat = data.reservations.some(reservation => 
          reservation.busID === busID && 
          reservation.seatNumber === seat.seatNumber && 
          reservation.status === "Completed" &&
          reservation.reservationType === "Regular"
        );
        
        if (hadThisSeat) {
          toast.success(`Renewing your previous seat ${seat.seatNumber}!`);
        } else {
          toast.error(`Seat ${seat.seatNumber} is pending renewal by another student`);
          return;
        }
      } catch (error) {
        console.error("Error checking student history:", error);
        toast.error(`Seat ${seat.seatNumber} is not available`);
        return;
      }
    } else {
      toast.error(`Seat ${seat.seatNumber} is not available`);
      return;
    }
    
    // Redirect to fee summary page with seat details
    navigate("/fee-summary", {
      state: {
        busID: busID,
        seatNumber: seat.seatNumber,
        studentType: studentType,
        studentID: urlStudentID,
        isRenewal: seat.status === "Pending"
      }
    });
  };

  // Check if student can join waitlist (validate before showing form)
  const handleShowWaitlistForm = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStudentID = urlParams.get('studentID') || studentID;
    const studentType = urlParams.get('type') || 'Regular';
    
    // Validate student ID exists
    if (!urlStudentID) {
      toast.error("Student ID is missing. Please login again.");
      navigate('/student-login');
      return;
    }
    
    // ✅ CHECK 1: Verify student doesn't have an active reservation
    try {
      console.log(" Checking active reservations for student:", urlStudentID);
      const response = await fetch(`http://localhost:5000/api/reservations/student/${urlStudentID}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(" All reservations (raw response):", data);
      
      // API returns array directly, not wrapped in { reservations: [...] }
      const allReservations = Array.isArray(data) ? data : (data.reservations || []);
      
      console.log(" All reservations (parsed):", allReservations);
      
      const activeReservations = allReservations.filter(r => 
        r.status === "Booked" || r.status === "Reserved"
      );
      
      console.log("✓ Active reservations found:", activeReservations);
      console.log("✓ Number of active reservations:", activeReservations.length);
      
      if (activeReservations.length > 0) {
        const activeRes = activeReservations[0];
        console.log(" BLOCKING: Student has active reservation:", activeRes);
        toast.error(
          `You already have an active reservation on Bus ${activeRes.busID}, Seat ${activeRes.seatNumber}. ` +
          `You cannot join waitlist while having an active reservation.`,
          { duration: 5000 }
        );
        return; // STOP HERE - Don't show form
      }
      
      console.log("✅ No active reservations found - checking pending renewals next");
    } catch (error) {
      console.error(" Error checking active reservations:", error);
      toast.error("Unable to verify your reservation status. Please try again.");
      return; // STOP HERE - Don't show form
    }
    
    //  CHECK 2: Verify student doesn't have a pending renewal
    console.log("Checking pending renewals - studentType:", studentType, "history length:", studentHistory.length);
    
    if (studentType === 'Regular' && studentHistory.length > 0) {
      const pendingRenewalSeat = studentHistory.find(reservation => 
        reservation.busID === busID && 
        reservation.status === "Completed" &&
        reservation.reservationType === "Regular"
      );
      
      console.log("Pending renewal seat found:", pendingRenewalSeat);
      
      if (pendingRenewalSeat) {
        const isPendingSeat = seats.find(s => 
          s.seatNumber === pendingRenewalSeat.seatNumber && 
          s.status === "Pending"
        );
        
        console.log("Is seat currently pending?", isPendingSeat);
        
        if (isPendingSeat) {
          console.log(" BLOCKING: Student has pending renewal for seat:", pendingRenewalSeat.seatNumber);
          toast.error(
            `You have a pending renewal for Seat ${pendingRenewalSeat.seatNumber}! ` +
            `Please renew your seat or wait for it to be released before joining waitlist.`,
            { duration: 5000 }
          );
          return; //  STOP HERE - Don't show form
        }
      }
    }
    
    // All validations passed - show the waitlist form
    console.log("All validations passed - showing waitlist form");
    setShowWaitlistForm(true);
  };

  const handleJoinWaitlist = async () => {
    try {
      setWaitlistLoading(true);
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const studentType = urlParams.get('type') || 'Regular';
      const urlStudentID = urlParams.get('studentID') || studentID;
      
      // Validate student ID exists
      if (!urlStudentID) {
        toast.error("Student ID is missing. Please login again.");
        navigate('/student-login');
        return;
      }
      
      // ✅ USE ROUTE ID FROM PROPS (passed from parent component)
      if (!routeID) {
        console.error("Route ID not provided as prop");
        toast.error("Unable to determine route information. Please try again.");
        return;
      }
      
      console.log(" Using routeID from props:", routeID);
      
      // Create waitlist entry with validated data
      const waitlistEntry = {
        studentID: urlStudentID,
        busID: busID,
        routeID: routeID,
        reservationType: studentType,
        requestedDate: new Date().toISOString().split('T')[0], // Today's date
        daysRequested: 30, // Default 1 month
        seasonType: "FirstSemester" // Default semester
      };

      const result = await joinWaitlist(waitlistEntry);
      
      toast.success(`Successfully joined waitlist! You are position #${result.position}`);
      setShowWaitlistForm(false);
      
      // Refresh availability info
      await loadAvailabilityInfo();
      
    } catch (error) {
      console.error("Waitlist join error:", error);
      toast.error(error.message || "Failed to join waitlist");
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return <div>Loading seats...</div>;
  }

  const availableSeatsCount = seats.filter(seat => seat.status === "Available").length;

  // Check if Regular student has pending renewal seat on this bus
  const urlParams = new URLSearchParams(window.location.search);
  const studentType = urlParams.get('type') || 'Regular';
  const pendingRenewalSeat = studentType === 'Regular' && studentHistory.length > 0 
    ? studentHistory.find(reservation => 
        reservation.busID === busID && 
        reservation.status === "Completed" &&
        reservation.reservationType === "Regular"
      )
    : null;

  const hasPendingRenewal = pendingRenewalSeat && seats.some(s => 
    s.seatNumber === pendingRenewalSeat.seatNumber && 
    s.status === "Pending"
  );

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      {/* Pending Renewal Warning */}
      {hasPendingRenewal && (
        <div style={{
          background: "#fff3cd",
          border: "2px solid #ffc107",
          boxShadow: "0 3px 15px 0 rgba(255,193,7,0.2)",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          textAlign: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 28, marginRight: 8 }} role="img" aria-label="renewal">🔄</span>
            <h3 style={{ margin: 0, color: "#856404", fontSize: 18, fontWeight: 700 }}>
              Pending Seat Renewal
            </h3>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#856404", fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
            You have a pending renewal for your previous seat!
          </p>
          <div style={{
            background: "#fff",
            border: "2px solid #ffc107",
            borderRadius: 8,
            padding: 15,
            fontSize: 16,
            color: "#495057",
            marginBottom: 12
          }}>
            <strong style={{ fontSize: 18, color: "#856404" }}>Seat {pendingRenewalSeat.seatNumber}</strong>
            <br/>
            <span style={{ fontSize: 14, color: "#6c757d" }}>Bus {busID}</span>
          </div>
          <p style={{ margin: "0", color: "#856404", fontSize: 13, fontStyle: "italic", lineHeight: 1.4 }}>
            ⚠️ <strong>Important:</strong> You can ONLY renew <strong>Seat {pendingRenewalSeat.seatNumber}</strong>. 
            You cannot book any other seats until you complete the renewal or the seat is released.
          </p>
        </div>
      )}

      {/* Active Reservation Warning */}
      {activeReservation && (
        <div style={{
          background: "#fff3cd",
          border: "1.5px solid #ffeaa7",
          boxShadow: "0 2px 12px 0 rgba(255,193,7,0.15)",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          textAlign: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 24, marginRight: 8 }} role="img" aria-label="warning">⚠️</span>
            <h3 style={{ margin: 0, color: "#856404", fontSize: 18, fontWeight: 700 }}>
              Active Reservation Found
            </h3>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#856404", fontSize: 14, lineHeight: 1.5 }}>
            You already have an active reservation:
          </p>
          <div style={{
            background: "#fff",
            border: "1px solid #ffeaa7",
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            color: "#495057"
          }}>
            <strong>Bus {activeReservation.busID}</strong> • Seat <strong>{activeReservation.seatNumber}</strong><br/>
            Status: <span style={{ color: "#28a745", fontWeight: 600 }}>{activeReservation.status}</span><br/>
            <small>Reservation ID: {activeReservation.reservationID}</small>
          </div>
          <p style={{ margin: "12px 0 0 0", color: "#856404", fontSize: 13, fontStyle: "italic" }}>
            Only one active reservation per student is allowed. You cannot book additional seats.
          </p>
        </div>
      )}

      {/* Availability Info */}
      {availabilityInfo && (
        <div style={{
          background: "#fff",
          border: `1.5px solid ${availableSeatsCount === 0 ? "#f5c6cb" : "#bee5eb"}`,
          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.07)",
          padding: 20,
          borderRadius: 12,
          marginBottom: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 28, marginRight: 10 }} role="img" aria-label="bus">🚌</span>
            <h3 style={{ margin: 0, color: availableSeatsCount === 0 ? "#b71c1c" : "#0277bd", fontWeight: 700, fontSize: 20 }}>
              Seat Availability
            </h3>
          </div>
          <div style={{ marginLeft: 38 }}>
            <div style={{ color: availableSeatsCount === 0 ? "#b71c1c" : "#0277bd", fontWeight: 500, fontSize: 16 }}>
              <span style={{ fontWeight: 700 }}>{availabilityInfo.availableSeats}</span> / {availabilityInfo.totalSeats} seats available
            </div>
            {availabilityInfo.waitlistCount > 0 && (
              <div style={{ color: "#ff9800", fontSize: 15, marginTop: 2 }}>
                <span style={{ fontWeight: 600 }}>Waitlist:</span> {availabilityInfo.waitlistCount} student{availabilityInfo.waitlistCount > 1 ? "s" : ""}
              </div>
            )}
            {availableSeatsCount === 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: "#b71c1c", fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                  <span role="img" aria-label="alert">❗</span> This bus is fully booked!
                </div>
                <button
                  onClick={handleShowWaitlistForm}
                  disabled={waitlistLoading}
                  style={{
                    padding: "10px 28px",
                    background: waitlistLoading ? "#bdbdbd" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: waitlistLoading ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => {
                    if (!waitlistLoading) e.target.style.background = "#115293";
                  }}
                  onMouseLeave={e => {
                    if (!waitlistLoading) e.target.style.background = "#1976d2";
                  }}
                >
                  {waitlistLoading ? "Joining..." : "Join Waitlist"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Waitlist Confirmation Modal */}
      {showWaitlistForm && (
        <WaitlistConfirmation
          onConfirm={handleJoinWaitlist}
          onCancel={() => setShowWaitlistForm(false)}
          loading={waitlistLoading}
        />
      )}

      {/* Seat Legend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        marginBottom: 18,
        justifyContent: "center"
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block",
            width: 22,
            height: 22,
            background: "#43a047",
            borderRadius: 5,
            boxShadow: "0 1px 3px 0 rgba(67,160,71,0.10)",
            marginRight: 3
          }}></span>
          <span style={{ color: "#333", fontWeight: 500, fontSize: 15 }}>Available ({availableSeatsCount})</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block",
            width: 22,
            height: 22,
            background: "#e53935",
            borderRadius: 5,
            boxShadow: "0 1px 3px 0 rgba(229,57,53,0.10)",
            marginRight: 3
          }}></span>
          <span style={{ color: "#333", fontWeight: 500, fontSize: 15 }}>Booked</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block",
            width: 22,
            height: 22,
            background: "#ffb300",
            borderRadius: 5,
            boxShadow: "0 1px 3px 0 rgba(255,179,0,0.10)",
            marginRight: 3
          }}></span>
          <span style={{ color: "#333", fontWeight: 500, fontSize: 15 }}>Pending</span>
        </span>
      </div>

      {/* Seat Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 64px)",
          gap: 16,
          marginTop: 10,
          justifyContent: "center"
        }}
      >
        {seats.map((seat) => {
          // Check if this seat is blocked because student has pending renewal
          const isBlockedByRenewal = hasPendingRenewal && 
            seat.status === "Available" && 
            seat.seatNumber !== pendingRenewalSeat.seatNumber;
          
          const isRenewable = canRenewSeat(seat);
          const isClickable = !isBlockedByRenewal && (seat.status === "Available" || isRenewable);
          
          return (
            <button
              key={seat._id}
              onClick={() => handleClick(seat)}
              disabled={isBlockedByRenewal || (!isClickable && seat.status !== "Available")}
              style={{
                padding: "18px 0",
                borderRadius: 8,
                border: "none",
                background: isBlockedByRenewal
                  ? "linear-gradient(135deg, #bdbdbd 60%, #e0e0e0 100%)"
                  : seat.status === "Available"
                  ? "linear-gradient(135deg, #43a047 60%, #66bb6a 100%)"
                  : seat.status === "Booked"
                  ? "linear-gradient(135deg, #e53935 60%, #ef5350 100%)"
                  : isRenewable
                  ? "linear-gradient(135deg, #ff9800 60%, #ffb74d 100%)"
                  : "linear-gradient(135deg, #ffb300 60%, #ffe082 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                cursor: isClickable ? "pointer" : "not-allowed",
                boxShadow: isBlockedByRenewal
                  ? "0 2px 8px 0 rgba(189,189,189,0.13)"
                  : seat.status === "Available"
                  ? "0 2px 8px 0 rgba(67,160,71,0.13)"
                  : seat.status === "Booked"
                  ? "0 2px 8px 0 rgba(229,57,53,0.13)"
                  : "0 2px 8px 0 rgba(255,179,0,0.13)",
                transition: "transform 0.12s, box-shadow 0.12s",
                outline: "none",
                opacity: isBlockedByRenewal ? 0.5 : 1
              }}
              onMouseEnter={e => {
                if (isClickable) {
                  e.target.style.transform = "scale(1.08)";
                  if (seat.status === "Available" && !isBlockedByRenewal) {
                    e.target.style.boxShadow = "0 4px 16px 0 rgba(67,160,71,0.18)";
                  } else if (isRenewable) {
                    e.target.style.boxShadow = "0 4px 16px 0 rgba(255,152,0,0.25)";
                  }
                }
              }}
              onMouseLeave={e => {
                if (isClickable) {
                  e.target.style.transform = "scale(1)";
                  if (seat.status === "Available" && !isBlockedByRenewal) {
                    e.target.style.boxShadow = "0 2px 8px 0 rgba(67,160,71,0.13)";
                  } else if (isRenewable) {
                    e.target.style.boxShadow = "0 2px 8px 0 rgba(255,179,0,0.13)";
                  }
                }
              }}
            >
              {seat.seatNumber}
              {isRenewable && (
                <div style={{ fontSize: 10, marginTop: 2 }}>🔄 Renew</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Simple Waitlist Confirmation Component
const WaitlistConfirmation = ({ onConfirm, onCancel, loading }) => {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#fff",
        padding: 36,
        borderRadius: 16,
        width: 390,
        maxWidth: "92%",
        textAlign: "center",
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.13)"
      }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 54, marginBottom: 10 }}>🚌</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#1976d2", fontWeight: 700, fontSize: 22 }}>Join Waitlist</h3>
          <p style={{ margin: 0, color: "#444", lineHeight: 1.6, fontSize: 15 }}>
            This bus is currently full.<br />Would you like to join the waitlist? <br />You'll be notified when a seat becomes available.
          </p>
        </div>

        <div style={{
          background: "#f5f7fa",
          padding: 14,
          borderRadius: 8,
          marginBottom: 18,
          textAlign: "left"
        }}>
          <p style={{ margin: "0 0 7px 0", fontSize: 14, color: "#666" }}>
            <strong>Default Settings:</strong>
          </p>
          <p style={{ margin: "0 0 4px 0", fontSize: 14, color: "#666" }}>
            <span role="img" aria-label="calendar">📅</span> Duration: <b>1 Month (30 days)</b>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
            <span role="img" aria-label="clock">🕒</span> Start Date: <b>Today</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "12px 26px",
              background: "#bdbdbd",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              minWidth: 100,
              fontWeight: 500,
              boxShadow: "0 1px 4px 0 rgba(189,189,189,0.10)"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "12px 26px",
              background: loading ? "#bdbdbd" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 700,
              minWidth: 100,
              boxShadow: "0 1px 4px 0 rgba(25,118,210,0.10)",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => {
              if (!loading) e.target.style.background = "#115293";
            }}
            onMouseLeave={e => {
              if (!loading) e.target.style.background = "#1976d2";
            }}
          >
            {loading ? "Joining..." : "Yes, Join Waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
