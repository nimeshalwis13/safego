import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/student-login.css";

const StudentAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    studentID: "",
    password: ""
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    grade: "",
    studentType: "Regular",
    parentName: "",
    parentPhone: "",
    emergencyContact: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle login input change
  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  // Handle registration input change
  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  // Handle login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginData.studentID || !loginData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/students/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        // Store student data in localStorage
        localStorage.setItem("studentData", JSON.stringify(data.student));
        
        // Navigate to seat reservation page with student type
        navigate(`/seat-reservation?type=${data.student.studentType}&studentID=${data.student.studentID}`);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please check if the server is running.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle registration submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = registerData;
      
      const response = await fetch("http://localhost:5000/api/students/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Registration successful! Please login with your credentials.");
        // Reset form
        setRegisterData({
          name: "",
          email: "",
          phone: "",
          address: "",
          grade: "",
          studentType: "Regular",
          parentName: "",
          parentPhone: "",
          emergencyContact: "",
          password: "",
          confirmPassword: ""
        });
        
        // Switch to login form after 2 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccess("");
          // Show the generated Student ID in an alert
          alert(`Registration Successful!\n\nYour Student ID is: ${data.student.studentID}\n\nPlease use this ID to login.`);
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Connection error. Please check if the server is running.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px"
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: isLogin ? "450px" : "700px",
    width: "100%",
    margin: "20px"
  };

  const headingStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: "10px"
  };

  const subHeadingStyle = {
    fontSize: "14px",
    textAlign: "center",
    color: "#666",
    marginBottom: "30px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "2px solid #e9ecef",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box",
    marginBottom: "15px"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  };

  const buttonStyle = {
    width: "100%",
    padding: "15px",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: loading ? "not-allowed" : "pointer",
    backgroundColor: loading ? "#ccc" : "#007bff",
    color: "white",
    transition: "all 0.3s ease",
    marginTop: "10px"
  };

  const switchButtonStyle = {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
    marginTop: "15px"
  };

  const errorStyle = {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
    border: "1px solid #f5c6cb"
  };

  const successStyle = {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
    fontSize: "14px",
    border: "1px solid #c3e6cb"
  };

  const formRowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "0px"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>
          SafeGo Student Portal
        </h1>
        <p style={subHeadingStyle}>
          {isLogin ? "Login to access bus seat reservation system" : "Register for a new student account - Student ID will be auto-generated"}
        </p>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        {isLogin ? (
          // Login Form
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Student ID</label>
              <input
                type="text"
                name="studentID"
                value={loginData.studentID}
                onChange={handleLoginChange}
                placeholder="Enter your Student ID"
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                style={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = "#0056b3";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = "#007bff";
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                  style={switchButtonStyle}
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegisterSubmit}>
            <div style={formRowStyle}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Enter full name"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="student@email.com"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  placeholder="0771234567"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "0px" }}>
              <label style={labelStyle}>Address *</label>
              <input
                type="text"
                name="address"
                value={registerData.address}
                onChange={handleRegisterChange}
                placeholder="Enter full address"
                style={inputStyle}
                required
              />
            </div>

            <div style={formRowStyle}>
              <div>
                <label style={labelStyle}>Grade *</label>
                <select
                  name="grade"
                  value={registerData.grade}
                  onChange={handleRegisterChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Select Grade</option>
                  {[...Array(13)].map((_, i) => (
                    <option key={i + 1} value={`Grade ${i + 1}`}>
                      Grade {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Student Type *</label>
                <select
                  name="studentType"
                  value={registerData.studentType}
                  onChange={handleRegisterChange}
                  style={inputStyle}
                  required
                >
                  <option value="Regular">Regular Student</option>
                  <option value="Temporary">Temporary Student</option>
                </select>
              </div>
            </div>

            <div style={formRowStyle}>
              <div>
                <label style={labelStyle}>Parent/Guardian Name *</label>
                <input
                  type="text"
                  name="parentName"
                  value={registerData.parentName}
                  onChange={handleRegisterChange}
                  placeholder="Parent's name"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Parent Phone *</label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={registerData.parentPhone}
                  onChange={handleRegisterChange}
                  placeholder="Parent's phone"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "0px" }}>
              <label style={labelStyle}>Emergency Contact *</label>
              <input
                type="tel"
                name="emergencyContact"
                value={registerData.emergencyContact}
                onChange={handleRegisterChange}
                placeholder="Emergency contact number"
                style={inputStyle}
                required
              />
            </div>

            <div style={formRowStyle}>
              <div>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Min. 6 characters"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Re-enter password"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              style={buttonStyle}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = "#0056b3";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = "#007bff";
              }}
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p style={{ fontSize: "14px", color: "#666" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                    setSuccess("");
                  }}
                  style={switchButtonStyle}
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentAuth;
