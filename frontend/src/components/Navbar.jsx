import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "🚌 Parent Portal", description: "Book seats for students" },
    { path: "/admin", label: "🏫 Admin Dashboard", description: "Manage buses and seats" }
  ];

  return (
    <nav style={{
      backgroundColor: "#343a40",
      padding: "15px 20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        {/* Logo */}
        <div style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>
          SafeGo
        </div>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "20px" }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: "10px 20px",
                backgroundColor: location.pathname === item.path ? "#007bff" : "transparent",
                color: "white",
                border: location.pathname === item.path ? "none" : "1px solid #6c757d",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = "#495057";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
              title={item.description}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;