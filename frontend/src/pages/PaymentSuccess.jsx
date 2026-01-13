import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/payment-success.css";

// Same bus data as in SeatReservationPage
const buses = [
  { id: "SGB001", route: "R1", name: "Bus 001" },
  { id: "SGB002", route: "R1", name: "Bus 002" },
  { id: "SGB003", route: "R2", name: "Bus 003" },
  { id: "SGB004", route: "R3", name: "Bus 004" },
];

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get all the data passed from PaymentGateway including studentID, studentType, and feeBreakdown
  const { reservation, busID, studentID, studentType, feeBreakdown } = location.state || {};
  
  // 🔍 DEBUG: Log the data to see what we're getting
  console.log("🔍 PaymentSuccess - Full location.state:", location.state);
  console.log("🔍 PaymentSuccess - Reservation object:", reservation);
  console.log("🔍 PaymentSuccess - studentID from state:", studentID);
  console.log("🔍 PaymentSuccess - feeBreakdown:", feeBreakdown);
  console.log("🔍 PaymentSuccess - reservation.feeAmount:", reservation?.feeAmount);
  console.log("🔍 PaymentSuccess - Reservation JSON:", JSON.stringify(reservation, null, 2));
  console.log("🔍 PaymentSuccess - reservation.reservationID:", reservation?.reservationID);
  console.log("🔍 PaymentSuccess - reservation._id:", reservation?._id);
  console.log("🔍 PaymentSuccess - All reservation keys:", reservation ? Object.keys(reservation) : "No reservation object");
  
  // Calculate the display amount (try multiple sources)
  const displayAmount = feeBreakdown?.totalFee || 
                        reservation?.feeAmount || 
                        0;
  
  // 🔍 DEBUG: Log amount calculation
  console.log("💰 Amount Calculation:");
  console.log("  - feeBreakdown.totalFee:", feeBreakdown?.totalFee);
  console.log("  - reservation.feeAmount:", reservation?.feeAmount);
  console.log("  - Final displayAmount:", displayAmount);
  
  // Calculate display status
  const displayStatus = reservation?.status || "Booked";
  console.log("📊 Status:", reservation?.status, "-> Display:", displayStatus);

  // Find the bus information based on busID
  const findBusInfo = (busId) => {
    return buses.find(bus => bus.id === busId) || { 
      id: busId, 
      route: "R1", 
      name: `Bus ${busId}` 
    };
  };

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "500px", 
      margin: "0 auto", 
      fontFamily: "Arial",
      textAlign: "center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }}>
      {/* Success Icon */}
      <div style={{ fontSize: "100px", marginBottom: "20px" }}>
        ✅
      </div>

      {/* Success Message */}
      <h1 style={{ color: "#28a745", marginBottom: "20px" }}>
        Payment Successful!
      </h1>
      
      <h2 style={{ color: "#333", marginBottom: "30px" }}>
        Your seat has been booked successfully
      </h2>

      {/* Reservation Details */}
      {reservation && (
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "10px",
          marginBottom: "30px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Booking Details</h3>
          <p><strong>Reservation ID:</strong> {reservation.reservationID || reservation._id || "Not Available"}</p>
          <p><strong>Student ID:</strong> {reservation.studentID || studentID}</p>
          <p><strong>Bus ID:</strong> {busID}</p>
          <p><strong>Reservation Type:</strong> {reservation.reservationType || studentType}</p>
          <p><strong>Status:</strong> <span style={{ color: "#28a745", fontWeight: "bold" }}>
            {displayStatus === "Approved" ? "Booked" : displayStatus}
          </span></p>
          <p><strong>Amount Paid:</strong> <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "18px" }}>LKR {displayAmount.toFixed(2)}</span></p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <button
          onClick={() => {
            // � FIX: Use the studentID from location.state first, then fallback to reservation
            let finalStudentID = studentID || reservation?.studentID;
            
            // If not in state or reservation, try URL params from current location
            if (!finalStudentID) {
              const urlParams = new URLSearchParams(window.location.search);
              const urlStudentID = urlParams.get("studentID");
              console.log("� Checking URL params for studentID:", urlStudentID);
              finalStudentID = urlStudentID;
            }
            
            // If still not found, try localStorage
            if (!finalStudentID) {
              const storedStudentID = localStorage.getItem("studentID");
              console.log("� Checking localStorage for studentID:", storedStudentID);
              finalStudentID = storedStudentID;
            }
            
            // Last resort fallback (should rarely happen now)
            if (!finalStudentID) {
              console.error("❌ No studentID found! Please login again.");
              toast.error("Student ID not found. Please login again.");
              navigate("/student-login");
              return;
            }
            
            // Use studentType from state first, then fallback to reservation
            const finalStudentType = studentType || reservation?.reservationType || "Regular";
            
            console.log("🚀 Navigating to profile with studentID:", finalStudentID);
            console.log("🚀 Student Type:", finalStudentType);
            
            navigate(`/student-profile?studentID=${finalStudentID}&type=${finalStudentType}`);
          }}
          style={{
            padding: "15px 30px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          View My Reservations
        </button>
      </div>

      {/* Thank You Message */}
      <div style={{ 
        marginTop: "40px", 
        padding: "20px", 
        backgroundColor: "#e3f2fd",
        borderRadius: "10px",
        border: "1px solid #bbdefb"
      }}>
        <p style={{ margin: 0, color: "#1976d2", fontSize: "16px" }}>
          Thank you for using SafeGo! Have a safe journey! 🚌
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;