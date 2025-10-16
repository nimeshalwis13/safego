import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const FeeSummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from previous page
  const { busID, seatNumber, studentType, studentID } = location.state || {};
  
  const [days, setDays] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState('monthly'); // For regular students: 'monthly' or 'annual'
  const [feeBreakdown, setFeeBreakdown] = useState({
    registrationFee: 0,
    monthlyFee: 0,
    annualFee: 0,
    dailyFee: 0,
    totalFee: 0
  });
  const [loading, setLoading] = useState(false);

  // Calculate fees when component loads or days/payment plan change
  useEffect(() => {
    calculateFees();
  }, [days, studentType, paymentPlan]);

  const calculateFees = () => {
    let breakdown = {
      registrationFee: 0,
      monthlyFee: 0,
      annualFee: 0,
      dailyFee: 0,
      totalFee: 0
    };

    if (studentType === "Regular") {
      // For regular students - two payment options
      if (paymentPlan === 'monthly') {
        breakdown.registrationFee = 1000; // Registration fee for monthly plan
        breakdown.monthlyFee = 4000;      // Monthly fee (updated from 3500 to 4000)
        breakdown.totalFee = breakdown.registrationFee + breakdown.monthlyFee;
      } else if (paymentPlan === 'sixMonth') {
        breakdown.annualFee = 18000;      // 6-month fee (18000 for 6 months)
        breakdown.totalFee = breakdown.annualFee;
      }
    } else if (studentType === "Temporary") {
      // For temporary students
      breakdown.dailyFee = 200;        // Daily charge (unchanged)
      breakdown.totalFee = breakdown.dailyFee * days;
    }

    setFeeBreakdown(breakdown);
  };

  const handleContinueToPayment = async () => {
    if (!busID || !seatNumber || !studentID) {
      toast.error("Missing reservation details");
      return;
    }

    setLoading(true);

    try {
      // Create reservation with calculated fees
      const reservationData = {
        studentID: studentID,
        busID: busID,
        seatNumber: seatNumber,
        reservationType: studentType,
        startDate: new Date().toISOString().split('T')[0],
      };

      if (studentType === 'Regular') {
        // For regular students, only send seasonType - backend will calculate endDate and daysBooked
        reservationData.seasonType = paymentPlan === 'monthly' ? 'Monthly' : 'SixMonth';
      } else if (studentType === 'Temporary') {
        // For temporary students, send custom endDate and daysBooked
        reservationData.endDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        reservationData.daysBooked = days;
      }

      const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Reservation created! Proceeding to payment...");
        
        // Navigate to payment gateway with reservation details
        navigate("/payment", {
          state: {
            reservation: result,
            busID: busID,
            seatNumber: seatNumber,
            studentType: studentType,
            studentID: studentID,
            paymentPlan: paymentPlan,
            feeBreakdown: feeBreakdown
          }
        });
      } else {
        toast.error(result.message || "Failed to create reservation");
      }
    } catch (error) {
      toast.error("Failed to create reservation");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (!busID || !seatNumber || !studentType || !studentID) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Missing Information</h2>
        <p>Required reservation details are missing.</p>
        <button 
          onClick={() => navigate("/seat-reservation")}
          style={{ padding: "10px 20px", marginTop: "20px" }}
        >
          Back to Seat Selection
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    }}>
      <div style={{ 
        width: "100%",
        maxWidth: "600px", 
        fontFamily: "Arial"
      }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: "#007bff", 
        color: "white", 
        padding: "20px", 
        borderRadius: "10px 10px 0 0",
        textAlign: "center"
      }}>
        <h2>🧾 Fee Summary</h2>
        <p>Review your reservation details and fees</p>
      </div>

      {/* Reservation Details */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        border: "1px solid #ddd"
      }}>
        <h3>Reservation Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <p><strong>Student ID:</strong> {studentID}</p>
            <p><strong>Student Type:</strong> {studentType}</p>
          </div>
          <div>
            <p><strong>Bus ID:</strong> {busID}</p>
            <p><strong>Seat Number:</strong> {seatNumber}</p>
          </div>
        </div>
      </div>

      {/* Payment Plan Selection for Regular Students */}
      {studentType === "Regular" && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          border: "1px solid #ddd",
          borderTop: "none"
        }}>
          <h3>Select Payment Plan</h3>
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            {/* Monthly Plan Option */}
            <div 
              onClick={() => setPaymentPlan('monthly')}
              style={{
                flex: 1,
                padding: "15px",
                border: `2px solid ${paymentPlan === 'monthly' ? '#007bff' : '#e9ecef'}`,
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: paymentPlan === 'monthly' ? '#e7f3ff' : 'white',
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <input 
                  type="radio" 
                  checked={paymentPlan === 'monthly'} 
                  onChange={() => setPaymentPlan('monthly')}
                  style={{ marginRight: "8px" }}
                />
                <strong>Monthly Plan</strong>
              </div>
              <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                Registration Fee: LKR 1,000<br/>
                Monthly Fee: LKR 4,000<br/>
                <strong>Total: LKR 5,000</strong>
              </p>
            </div>

            {/* 6-Month Plan Option */}
            <div 
              onClick={() => setPaymentPlan('sixMonth')}
              style={{
                flex: 1,
                padding: "15px",
                border: `2px solid ${paymentPlan === 'sixMonth' ? '#28a745' : '#e9ecef'}`,
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: paymentPlan === 'sixMonth' ? '#d4edda' : 'white',
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <input 
                  type="radio" 
                  checked={paymentPlan === 'sixMonth'} 
                  onChange={() => setPaymentPlan('sixMonth')}
                  style={{ marginRight: "8px" }}
                />
                <strong>6-Month Plan</strong>
                <span style={{ 
                  marginLeft: "auto", 
                  backgroundColor: "#28a745", 
                  color: "white", 
                  padding: "2px 6px", 
                  borderRadius: "3px", 
                  fontSize: "10px" 
                }}>
                  SAVE LKR 12,000
                </span>
              </div>
              <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                No Registration Fee<br/>
                6-Month Fee: LKR 18,000<br/>
                <strong>Total: LKR 18,000</strong>
              </p>
            </div>
          </div>
          <div style={{ 
            backgroundColor: "#fff3cd", 
            padding: "10px", 
            borderRadius: "5px",
            fontSize: "12px",
            color: "#856404"
          }}>
            💡 <strong>6-Month Plan saves you LKR 12,000</strong> compared to 6 months of monthly payments (6 × 5,000 = 30,000)
          </div>
        </div>
      )}

      {/* Days Input for Temporary Students */}
      {studentType === "Temporary" && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          border: "1px solid #ddd",
          borderTop: "none"
        }}>
          <h3>Specify Duration</h3>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#333" 
            }}>
              Number of Days Required
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(14, parseInt(e.target.value) || 1)))}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <p style={{
              fontSize: "12px",
              color: "#6c757d",
              margin: "5px 0 0 0"
            }}>
              💡 Enter the number of days you need bus service (1-14 days maximum)
            </p>
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        border: "1px solid #ddd",
        borderTop: studentType === "Temporary" ? "none" : "1px solid #ddd"
      }}>
        <h3>Fee Breakdown</h3>
        
        {studentType === "Regular" ? (
          <div>
            {paymentPlan === 'monthly' ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span>Registration Fee:</span>
                  <span>LKR {feeBreakdown.registrationFee.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span>Monthly Fee:</span>
                  <span>LKR {feeBreakdown.monthlyFee.toFixed(2)}</span>
                </div>
                <hr style={{ margin: "15px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                  <span>Total Fee:</span>
                  <span style={{ color: "#007bff" }}>LKR {feeBreakdown.totalFee.toFixed(2)}</span>
                </div>
                <div style={{ 
                  backgroundColor: "#e7f3ff", 
                  padding: "10px", 
                  borderRadius: "5px",
                  marginTop: "15px",
                  fontSize: "14px",
                  color: "#0066cc"
                }}>
                  ℹ️ This covers your registration and first month of bus service
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span>Registration Fee:</span>
                  <span style={{ color: "#28a745" }}>FREE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span>6-Month Fee:</span>
                  <span>LKR {feeBreakdown.annualFee.toFixed(2)}</span>
                </div>
                <hr style={{ margin: "15px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                  <span>Total Fee:</span>
                  <span style={{ color: "#28a745" }}>LKR {feeBreakdown.totalFee.toFixed(2)}</span>
                </div>
                <div style={{ 
                  backgroundColor: "#d4edda", 
                  padding: "10px", 
                  borderRadius: "5px",
                  marginTop: "15px",
                  fontSize: "14px",
                  color: "#155724"
                }}>
                  ℹ️ This covers 6 months of bus service with no registration fee!<br/>
                  <strong>💰 You save LKR 12,000 compared to 6 monthly payments</strong>
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span>Daily Charge:</span>
              <span>LKR {feeBreakdown.dailyFee.toFixed(2)} per day</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span>Number of Days:</span>
              <span>{days} day{days > 1 ? 's' : ''}</span>
            </div>
            <hr style={{ margin: "15px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
              <span>Total Fee:</span>
              <span style={{ color: "#28a745" }}>LKR {feeBreakdown.totalFee.toFixed(2)}</span>
            </div>
            <div style={{ 
              backgroundColor: "#d4edda", 
              padding: "10px", 
              borderRadius: "5px",
              marginTop: "15px",
              fontSize: "14px",
              color: "#155724"
            }}>
              ℹ️ This covers {days} day{days > 1 ? 's' : ''} of temporary bus service (Maximum: 14 days)
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "0 0 10px 10px",
        border: "1px solid #ddd",
        borderTop: "none"
      }}>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={handleGoBack}
            disabled={loading}
            style={{
              flex: 1,
              padding: "15px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            ← Go Back
          </button>
          
          <button
            onClick={handleContinueToPayment}
            disabled={loading}
            style={{
              flex: 2,
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Creating Reservation..." : "Continue to Payment Gateway →"}
          </button>
        </div>
        </div>

        {/* Info Notice */}
        <div style={{ 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7",
          padding: "15px", 
          borderRadius: "5px",
          marginTop: "20px",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            📋 Please review all details before proceeding to payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeeSummaryPage;