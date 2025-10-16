import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/student-login.css";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [studentID, setStudentID] = useState("");

  const handleStudentTypeSelection = (studentType) => {
    if (!studentID.trim()) {
      alert("Please enter a Student ID");
      return;
    }
    navigate(`/seat-reservation?type=${studentType}&studentID=${studentID.trim()}`);
  };

  const handleViewWaitlist = () => {
    if (!studentID.trim()) {
      alert("Please enter a Student ID");
      return;
    }
    navigate(`/waitlist?studentID=${studentID.trim()}`);
  };

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif"
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    width: "100%",
    margin: "20px"
  };

  const headingStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: "30px",
    margin: "0 0 30px 0"
  };

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  };

  const buttonBaseStyle = {
    width: "100%",
    padding: "15px 20px",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "white"
  };

  const regularButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#007bff"
  };

  const temporaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#28a745"
  };

  const waitlistButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#6c757d"
  };

  const noteStyle = {
    marginTop: "25px",
    padding: "15px",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "8px"
  };

  const noteTextStyle = {
    fontSize: "14px",
    color: "#856404",
    margin: 0,
    lineHeight: "1.4"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>
          SafeGo Student Portal
        </h1>
        
        {/* Student ID Input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontSize: "14px", 
            fontWeight: "600", 
            color: "#333" 
          }}>
            Student ID
          </label>
          <input
            type="text"
            value={studentID}
            onChange={(e) => setStudentID(e.target.value)}
            placeholder="Enter your Student ID"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              border: "2px solid #e9ecef",
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.3s ease",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#007bff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e9ecef";
            }}
          />

        </div>
        
        <div style={buttonContainerStyle}>
          <button
            onClick={() => handleStudentTypeSelection("Regular")}
            style={regularButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#0056b3";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#007bff";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Login as Regular Student
          </button>
          
          <button
            onClick={() => handleStudentTypeSelection("Temporary")}
            style={temporaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#1e7e34";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Login as Temporary Student
          </button>
          
          <button
            onClick={handleViewWaitlist}
            style={waitlistButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#545b62";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#6c757d";
              e.target.style.transform = "translateY(0)";
            }}
          >
            View My Waitlist
          </button>
        </div>
        
        <div style={noteStyle}>
          <p style={noteTextStyle}>
            <strong>Welcome to SafeGo!</strong> Please enter your Student ID and select your student type to access the bus seat reservation system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;