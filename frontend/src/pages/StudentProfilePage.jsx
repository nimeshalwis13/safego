import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/student-profile.css";

const StudentProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentID = searchParams.get("studentID");
  const studentType = searchParams.get("type") || "Regular";

  const [studentInfo, setStudentInfo] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancellingReservation, setCancellingReservation] = useState(false);

  useEffect(() => {
    if (studentID) {
      loadStudentData();
    } else {
      toast.error("No student ID provided");
      navigate("/student-login");
    }
  }, [studentID]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Load student info
      const studentResponse = await fetch(`http://localhost:5000/api/students/${studentID}`);
      const studentData = await studentResponse.json();
      
      console.log("🔍 Student API Response:", studentData);
      
      // Handle the response format: { success: true, student: {...} }
      if (studentData.success && studentData.student) {
        console.log("✅ Student Info:", studentData.student);
        setStudentInfo(studentData.student);
      } else {
        console.error("❌ Student data not found:", studentData);
        toast.error("Student information not found");
      }

      // Load reservations
      const reservationsResponse = await fetch(`http://localhost:5000/api/reservations/student/${studentID}`);
      const reservationsData = await reservationsResponse.json();
      
      // Parse reservations (API returns array directly)
      const allReservations = Array.isArray(reservationsData) ? reservationsData : [];
      
      // Find active reservation
      const active = allReservations.find(r => r.status === "Booked" || r.status === "Reserved");
      setActiveReservation(active || null);

      // Get history (completed/cancelled)
      const history = allReservations.filter(r => 
        r.status === "Completed" || r.status === "Cancelled"
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReservationHistory(history);

      // Load waitlist count
      try {
        const waitlistResponse = await fetch(`http://localhost:5000/api/waitlist/student/${studentID}`);
        const waitlistData = await waitlistResponse.json();
        setWaitlistCount(waitlistData.waitlistEntries?.length || 0);
      } catch (error) {
        console.error("Error loading waitlist:", error);
        setWaitlistCount(0);
      }

    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!activeReservation) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel your reservation for Bus ${activeReservation.busID}, Seat ${activeReservation.seatNumber}?\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setCancellingReservation(true);

      const response = await fetch(`http://localhost:5000/api/reservations/${activeReservation._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
      });

      if (!response.ok) {
        throw new Error("Failed to cancel reservation");
      }

      toast.success("Reservation cancelled successfully");
      loadStudentData(); // Reload data
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error(error.message || "Failed to cancel reservation");
    } finally {
      setCancellingReservation(false);
    }
  };

  const handleConvertToRegular = async () => {
    // ⚠️ Block conversion if student has an active booking
    if (activeReservation) {
      toast.error(
        `Cannot convert to Regular Student!\n\nPlease complete or cancel your current booking (Bus ${activeReservation.busID}, Seat ${activeReservation.seatNumber}) first.`,
        { duration: 4000 }
      );
      return;
    }

    // Confirmation message when no active booking
    const confirmed = window.confirm(
      `Join as Regular Student?\n\n` +
      `• Book with Monthly or 6-Month plans\n` +
      `• Better pricing for long-term use\n` +
      `• Auto-renewal option\n\n` +
      `Do you want to continue?`
    );

    if (!confirmed) return;

    try {
      setCancellingReservation(true);
      toast.loading("Converting to Regular Student...");

      const response = await fetch(`http://localhost:5000/api/students/${studentID}/convert-to-regular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to convert to regular student");
      }

      toast.dismiss();
      toast.success(data.message || "Successfully converted to Regular Student!");
      
      // Redirect to regular student profile
      setTimeout(() => {
        navigate(`/student-profile?studentID=${studentID}&type=Regular`, { replace: true });
        window.location.reload(); // Reload to update all data
      }, 1500);

    } catch (error) {
      toast.dismiss();
      console.error("Error converting to regular:", error);
      toast.error(error.message || "Failed to convert to regular student");
    } finally {
      setCancellingReservation(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      Booked: { bg: "#28a745", text: "white" },
      Reserved: { bg: "#ffc107", text: "#333" },
      Pending: { bg: "#6c757d", text: "white" },
      Completed: { bg: "#17a2b8", text: "white" },
      Cancelled: { bg: "#dc3545", text: "white" }
    };
    const color = colors[status] || { bg: "#6c757d", text: "white" };
    
    return (
      <span style={{
        backgroundColor: color.bg,
        color: color.text,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600"
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#666" }}>Loading student profile...</div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#dc3545" }}>Student not found</div>
        <button
          onClick={() => navigate("/student-login")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="student-profile-container">
      {/* Header */}
      <div className="profile-header">
        <button
          onClick={() => navigate(`/seat-reservation?studentID=${studentID}&type=${studentType}`)}
          className="back-button"
        >
          ← Back
        </button>
        <h1>Student Profile</h1>
        <button
          onClick={() => {
            // Clear any stored session data (if you add localStorage later)
            // localStorage.removeItem("studentID");
            // localStorage.removeItem("studentType");
            
            // Navigate to home page
            navigate("/");
          }}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-icon">
          <span style={{ fontSize: "48px" }}>👤</span>
        </div>
        <div className="profile-info">
          <h2>{studentInfo.name || 'Student'}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Student ID:</span>
              <span className="info-value">{studentInfo.studentID || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">
                <span className={`type-badge ${(studentInfo.studentType || studentType).toLowerCase()}`}>
                  {studentInfo.studentType || studentType}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{studentInfo.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{studentInfo.phone || 'N/A'}</span>
            </div>
            {studentInfo.grade && (
              <div className="info-item">
                <span className="info-label">Grade:</span>
                <span className="info-value">{studentInfo.grade}</span>
              </div>
            )}
            {studentInfo.parentPhone && (
              <div className="info-item">
                <span className="info-label">Parent Phone:</span>
                <span className="info-value">{studentInfo.parentPhone}</span>
              </div>
            )}
            {studentInfo.parentName && (
              <div className="info-item">
                <span className="info-label">Parent Name:</span>
                <span className="info-value">{studentInfo.parentName}</span>
              </div>
            )}
            {studentInfo.address && (
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">{studentInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          onClick={() => navigate(`/seat-reservation?studentID=${studentID}&type=${studentType}`)}
          className="action-btn primary"
        >
          🚌 Book a Seat
        </button>
        <button
          onClick={() => navigate(`/waitlist?studentID=${studentID}&type=${studentType}`)}
          className="action-btn secondary"
        >
          📋 View Waitlist ({waitlistCount})
        </button>
        {studentType === "Temporary" && studentInfo?.studentType === "Temporary" && (
          <button
            onClick={handleConvertToRegular}
            className="action-btn convert"
            disabled={cancellingReservation}
          >
            ⭐ Join as Regular Student
          </button>
        )}
      </div>

      {/* Active Reservation */}
      {activeReservation ? (
        <div className="section active-reservation">
          <h3>🎫 Current Booking</h3>
          <div className="reservation-card active">
            <div className="reservation-header">
              <div>
                <h4>Bus {activeReservation.busID} - Seat {activeReservation.seatNumber}</h4>
                <p className="reservation-type">{activeReservation.reservationType} Booking</p>
              </div>
              {getStatusBadge(activeReservation.status)}
            </div>
            <div className="reservation-details">
              <div className="detail-row">
                <span>📅 Start Date:</span>
                <span>{formatDate(activeReservation.startDate)}</span>
              </div>
              <div className="detail-row">
                <span>📅 End Date:</span>
                <span>{formatDate(activeReservation.endDate)}</span>
              </div>
              <div className="detail-row">
                <span>💰 Fee Amount:</span>
                <span>LKR : {activeReservation.feeAmount}</span>
              </div>
              <div className="detail-row">
                <span>💳 Payment Status:</span>
                <span className={`payment-status ${activeReservation.paymentStatus.toLowerCase()}`}>
                  {activeReservation.paymentStatus}
                </span>
              </div>
              {activeReservation.seasonType && (
                <div className="detail-row">
                  <span>📆 Season Type:</span>
                  <span>{activeReservation.seasonType}</span>
                </div>
              )}
            </div>
            <div className="reservation-actions">
              <button
                onClick={handleCancelReservation}
                disabled={cancellingReservation}
                className="cancel-btn"
              >
                {cancellingReservation ? "Cancelling..." : "Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="section no-reservation">
          <h3>🎫 Current Booking</h3>
          <div className="empty-state">
            <span style={{ fontSize: "48px" }}>📭</span>
            <p>You don't have any active bookings</p>
            <button
              onClick={() => navigate(`/seat-reservation?studentID=${studentID}&type=${studentType}`)}
              className="book-now-btn"
            >
              Book a Seat Now
            </button>
          </div>
        </div>
      )}

      {/* Booking History */}
      <div className="section booking-history">
        <h3>📜 Booking History</h3>
        {reservationHistory.length > 0 ? (
          <div className="history-list">
            {reservationHistory.slice(0, 5).map((reservation) => (
              <div key={reservation._id} className="history-item">
                <div className="history-header">
                  <div>
                    <h4>Bus {reservation.busID} - Seat {reservation.seatNumber}</h4>
                    <p className="history-date">
                      {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                    </p>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
                <div className="history-details">
                  <span>Type: {reservation.reservationType}</span>
                  <span>•</span>
                  <span>LKR : {reservation.feeAmount}</span>
                  <span>•</span>
                  <span>Booked: {formatDate(reservation.createdAt)}</span>
                </div>
              </div>
            ))}
            {reservationHistory.length > 5 && (
              <p className="more-history">
                + {reservationHistory.length - 5} more bookings
              </p>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span style={{ fontSize: "36px" }}>📋</span>
            <p>No booking history yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfilePage;
