import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PaymentGateway = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get reservation data from navigation state
  const { reservation, busID, seatNumber, studentType, studentID, paymentPlan, feeBreakdown } = location.state || {};
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: ""
  });
  
  const [processing, setProcessing] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    if (!reservation?._id) {
      toast.error("No reservation found");
      return;
    }

    setProcessing(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/${reservation._id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "Success" })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Payment Successful! Seat Booked!");
        // Redirect to success page or back to seat map
        navigate("/payment-success", { 
          state: { 
            reservation: result,
            busID: busID 
          }
        });
      } else {
        toast.error(result.message || "Payment processing failed");
      }
    } catch (error) {
      toast.error("Payment processing failed");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle payment decline
  const handlePaymentDecline = async () => {
    if (!reservation?._id) {
      toast.error("No reservation found");
      return;
    }

    setProcessing(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/${reservation._id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "Failed" })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.error("Payment Declined! Reservation Cancelled");
        // Navigate back to seat reservation with preserved studentID and studentType
        navigate(`/seat-reservation?type=${studentType}&studentID=${studentID}`, { 
          state: { 
            message: "Payment was declined. Please try again.",
            returnToBus: true,
            selectedBusInfo: {
              busID: busID,
              busNumber: `Bus ${busID}`,
              routeId: "R001"
            }
          }
        });
      } else {
        toast.error(result.message || "Failed to cancel reservation");
      }
    } catch (error) {
      toast.error("Failed to process payment decline");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle cancel and go back
  const handleCancelReservation = async () => {
    if (!reservation?._id) {
      toast.error("No reservation found");
      // Navigate back with preserved studentID and studentType
      navigate(`/seat-reservation?type=${studentType}&studentID=${studentID}`);
      return;
    }

    setProcessing(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/${reservation._id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "Failed" })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Reservation cancelled successfully");
        // Navigate back to seat reservation with preserved studentID and studentType
        navigate(`/seat-reservation?type=${studentType}&studentID=${studentID}`, { 
          state: { 
            message: "Reservation was cancelled. You can select another seat.",
            returnToBus: true,
            selectedBusInfo: {
              busID: busID,
              busNumber: `Bus ${busID}`,
              routeId: "R001"
            }
          }
        });
      } else {
        toast.error(result.message || "Failed to cancel reservation");
        // Still redirect back even if API fails, with preserved studentID
        navigate(`/seat-reservation?type=${studentType}&studentID=${studentID}`);
      }
    } catch (error) {
      toast.error("Failed to cancel reservation");
      console.error(error);
      // Still redirect back even if API fails, with preserved studentID
      navigate(`/seat-reservation?type=${studentType}&studentID=${studentID}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!reservation) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>No reservation found</h2>
        <button onClick={() => navigate("/")} style={{ padding: "10px 20px", marginTop: "20px" }}>
          Back to Seat Selection
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "500px", 
      margin: "0 auto", 
      fontFamily: "Arial", 
      backgroundColor: "#f8f9fa",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: "#007bff", 
        color: "white", 
        padding: "20px", 
        borderRadius: "10px 10px 0 0",
        textAlign: "center"
      }}>
        <h2>🏦 SafeGo Payment Gateway</h2>
        <p>Secure Payment Processing</p>
      </div>

      {/* Reservation Summary */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        border: "1px solid #ddd"
      }}>
        <h3>Reservation Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <div>
            <p><strong>Student ID:</strong> {studentID || reservation?.studentID}</p>
            <p><strong>Student Type:</strong> {studentType || reservation?.reservationType}</p>
          </div>
          <div>
            <p><strong>Bus ID:</strong> {busID}</p>
            <p><strong>Seat Number:</strong> {seatNumber || reservation?.seatNumber}</p>
          </div>
        </div>
        
        {/* Fee Breakdown */}
        {feeBreakdown && (
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "5px",
            marginTop: "15px"
          }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Fee Breakdown</h4>
            
            {/* Regular Student Payment Plans */}
            {studentType === "Regular" && paymentPlan === "monthly" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span>Registration Fee:</span>
                  <span>LKR {feeBreakdown.registrationFee.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span>Monthly Fee:</span>
                  <span>LKR {feeBreakdown.monthlyFee.toFixed(2)}</span>
                </div>
              </>
            )}
            
            {studentType === "Regular" && paymentPlan === "annual" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span>Registration Fee:</span>
                  <span style={{ color: "#28a745" }}>FREE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span>Annual Fee:</span>
                  <span>LKR {feeBreakdown.annualFee.toFixed(2)}</span>
                </div>
              </>
            )}
            
            {/* Temporary Student Daily Fee */}
            {studentType === "Temporary" && feeBreakdown.dailyFee > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span>Daily Fee (×{reservation?.daysBooked || 1} days):</span>
                <span>LKR {feeBreakdown.totalFee.toFixed(2)}</span>
              </div>
            )}
            <hr style={{ margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "16px" }}>
              <span>Total Amount:</span>
              <span style={{ color: "#007bff" }}>LKR {feeBreakdown.totalFee.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {/* Fallback if no fee breakdown */}
        {!feeBreakdown && (
          <div style={{ marginTop: "15px" }}>
            <p><strong>Amount:</strong> LKR {reservation?.feeAmount?.toFixed(2) || "0.00"}</p>
          </div>
        )}
      </div>

      {/* Payment Form */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        border: "1px solid #ddd"
      }}>
        <h3>Enter Card Details</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Card Number
          </label>
          <input
            type="text"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(cardDetails.cardNumber)}
            onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '') }))}
            maxLength="19"
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "5px",
              fontSize: "16px"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Expiry Date
            </label>
            <input
              type="text"
              name="expiryDate"
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
              onChange={handleInputChange}
              maxLength="5"
              style={{ 
                width: "100%", 
                padding: "12px", 
                border: "1px solid #ddd", 
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              CVV
            </label>
            <input
              type="text"
              name="cvv"
              placeholder="123"
              value={cardDetails.cvv}
              onChange={handleInputChange}
              maxLength="3"
              style={{ 
                width: "100%", 
                padding: "12px", 
                border: "1px solid #ddd", 
                borderRadius: "5px",
                fontSize: "16px"
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Card Holder Name
          </label>
          <input
            type="text"
            name="cardHolder"
            placeholder="John Doe"
            value={cardDetails.cardHolder}
            onChange={handleInputChange}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "5px",
              fontSize: "16px"
            }}
          />
        </div>
      </div>

      {/* Payment Buttons */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "0 0 10px 10px",
        border: "1px solid #ddd",
        borderTop: "none"
      }}>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={handlePaymentSuccess}
            disabled={processing}
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.7 : 1
            }}
          >
            {processing ? "Processing..." : "✅ Payment Success"}
          </button>
          
          <button
            onClick={handlePaymentDecline}
            disabled={processing}
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.7 : 1
            }}
          >
            {processing ? "Processing..." : "❌ Payment Decline"}
          </button>
        </div>

        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button
            onClick={handleCancelReservation}
            disabled={processing}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: processing ? "not-allowed" : "pointer",
              opacity: processing ? 0.7 : 1
            }}
          >
            {processing ? "Cancelling..." : "Cancel & Go Back"}
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div style={{ 
        backgroundColor: "#fff3cd", 
        border: "1px solid #ffeaa7",
        padding: "15px", 
        borderRadius: "5px",
        marginTop: "20px",
        textAlign: "center"
      }}>
        <p style={{ margin: 0, fontSize: "14px" }}>
          🔒 This is a simulation environment. No real payment will be processed.
        </p>
      </div>
    </div>
  );
};

export default PaymentGateway;