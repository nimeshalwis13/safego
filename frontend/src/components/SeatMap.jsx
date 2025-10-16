import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSeatsByBus, checkSeatAvailability, joinWaitlist } from "../services/api";
import toast from "react-hot-toast";
import "../styles/seat-map.css";

const SeatMap = ({ busID, studentID }) => {
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
      const urlStudentID = urlParams.get('studentID') || studentID || 'STUDENT001';
      
      const response = await fetch(`http://localhost:5000/api/reservations/student/${urlStudentID}`);
      const data = await response.json();
      
      // Check for active reservations (Booked or Reserved status)
      const activeReservations = data.reservations?.filter(r => 
        r.status === "Booked" || r.status === "Reserved"
      ) || [];
      
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
      const urlStudentID = urlParams.get('studentID') || studentID || 'STUDENT001';
      const studentType = urlParams.get('type') || 'Regular';
      
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
    const urlStudentID = urlParams.get('studentID') || studentID || 'STUDENT001'; // Use URL param, prop, or default

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

  // Handle joining waitlist with simple confirmation
  const handleJoinWaitlist = async () => {
    try {
      setWaitlistLoading(true);
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const routeID = sessionStorage.getItem('selectedRouteID');
      const studentType = urlParams.get('type') || 'Regular';
      const urlStudentID = urlParams.get('studentID') || studentID || 'STUDENT001';
      
      // Use default values for quick join
      const waitlistEntry = {
        studentID: urlStudentID,
        busID: busID,
        routeID: routeID || "ROUTE001",
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
      console.log("Waitlist data sent:", waitlistEntry);
      toast.error(error.message || "Failed to join waitlist");
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return <div>Loading seats...</div>;
  }

  const availableSeatsCount = seats.filter(seat => seat.status === "Available").length;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
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
                  onClick={() => setShowWaitlistForm(true)}
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
        {seats.map((seat) => (
          <button
            key={seat._id}
            onClick={() => handleClick(seat)}
            style={{
              padding: "18px 0",
              borderRadius: 8,
              border: "none",
              background:
                seat.status === "Available"
                  ? "linear-gradient(135deg, #43a047 60%, #66bb6a 100%)"
                  : seat.status === "Booked"
                  ? "linear-gradient(135deg, #e53935 60%, #ef5350 100%)"
                  : "linear-gradient(135deg, #ffb300 60%, #ffe082 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              cursor: seat.status === "Available" || canRenewSeat(seat) ? "pointer" : "not-allowed",
              boxShadow: seat.status === "Available"
                ? "0 2px 8px 0 rgba(67,160,71,0.13)"
                : seat.status === "Booked"
                ? "0 2px 8px 0 rgba(229,57,53,0.13)"
                : "0 2px 8px 0 rgba(255,179,0,0.13)",
              transition: "transform 0.12s, box-shadow 0.12s",
              outline: "none"
            }}
            onMouseEnter={e => {
              if (seat.status === "Available") {
                e.target.style.transform = "scale(1.08)";
                e.target.style.boxShadow = "0 4px 16px 0 rgba(67,160,71,0.18)";
              } else if (canRenewSeat(seat)) {
                e.target.style.transform = "scale(1.08)";
                e.target.style.boxShadow = "0 4px 16px 0 rgba(255,179,0,0.25)";
              }
            }}
            onMouseLeave={e => {
              if (seat.status === "Available") {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 2px 8px 0 rgba(67,160,71,0.13)";
              } else if (canRenewSeat(seat)) {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 2px 8px 0 rgba(255,179,0,0.13)";
              }
            }}
          >
            {seat.seatNumber}
          </button>
        ))}
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
