import React, { useState } from "react";
import toast from "react-hot-toast";
import { loginAdmin, registerAdmin } from "../services/api";

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "admin"
  });
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginAdmin(credentials);
      toast.success("Login successful!");
      onLogin(result.admin);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerAdmin(registerData);
      toast.success("Admin registered successfully! You can now login.");
      setIsRegisterMode(false);
      setRegisterData({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "admin"
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: "450px"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#333", marginBottom: "10px", fontSize: "28px" }}>🏫</h1>
          <h2 style={{ color: "#333", marginBottom: "5px" }}>SafeGo Admin</h2>
          <p style={{ color: "#666", fontSize: "14px" }}>School Bus Management System</p>
        </div>

        {isRegisterMode ? (
          /* Registration Form */
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={registerData.fullName}
                onChange={handleRegisterChange}
                placeholder="Enter full name"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                placeholder="Choose a username"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Enter email address"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create a password"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Role
              </label>
              <select
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              >
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: loading ? "#6c757d" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s"
              }}
            >
              {loading ? "Registering..." : "Register Admin"}
            </button>

            {/* Back to Login Link */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 0" }}>
                Already have an admin account?
              </p>
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleLoginChange}
                placeholder="Enter admin username"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "500"
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleLoginChange}
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#007bff"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: loading ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s"
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Register Link */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 0" }}>
                Don't have an admin account?
              </p>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Register New Admin
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "#999" }}>
            © 2025 SafeGo. Admin Portal Only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;