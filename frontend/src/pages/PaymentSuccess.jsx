import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  
  const { reservation, busID } = location.state || {};
  
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
          <p><strong>Reservation ID:</strong> {reservation._id}</p>
          <p><strong>Student ID:</strong> {reservation.studentID}</p>
          <p><strong>Bus ID:</strong> {busID}</p>
          <p><strong>Reservation Type:</strong> {reservation.reservationType}</p>
          <p><strong>Status:</strong> <span style={{ color: "#28a745", fontWeight: "bold" }}>{reservation.status === "Approved" ? "BOOKED" : reservation.status}</span></p>
          <p><strong>Amount Paid:</strong> LKR 150.00</p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <button
          onClick={() => {
            const busInfo = findBusInfo(busID);
            navigate("/", { 
              state: { 
                busID: busID,
                returnToBus: true,
                selectedBusInfo: busInfo
              } 
            });
          }}
          style={{
            padding: "15px 30px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Back to Seat Selection
        </button>
        
        <button
          onClick={() => {
            // You can implement a view reservations page later
            alert("View My Reservations feature coming soon!");
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