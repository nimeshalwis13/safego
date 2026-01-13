import React, { useState } from "react";
import toast from "react-hot-toast";
import RouteManagement from "./RouteManagement";
import BusRouteManagement from "./BusRouteManagement";
import PendingSeatManagement from "./PendingSeatManagement";
import WaitlistManagement from "./WaitlistManagement";
import Reports from "./Reports";

const Dashboard = ({ adminUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, routes, buses, pending, waitlist, reports

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#343a40",
        color: "white",
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
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>🏫 SafeGo Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.8 }}>
              Welcome back, {adminUser.username}
            </p>
          </div>
          
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #dee2e6"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          gap: "0"
        }}>
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "dashboard" ? "#007bff" : "transparent",
              color: activeTab === "dashboard" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "dashboard" ? "3px solid #007bff" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "routes" ? "#007bff" : "transparent",
              color: activeTab === "routes" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "routes" ? "3px solid #007bff" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            � Manage Routes
          </button>
          <button
            onClick={() => setActiveTab("buses")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "buses" ? "#007bff" : "transparent",
              color: activeTab === "buses" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "buses" ? "3px solid #007bff" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            🚌 Manage Buses
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "pending" ? "#e74c3c" : "transparent",
              color: activeTab === "pending" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "pending" ? "3px solid #e74c3c" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            💺 Seat Bookings
          </button>
          <button
            onClick={() => setActiveTab("waitlist")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "waitlist" ? "#6f42c1" : "transparent",
              color: activeTab === "waitlist" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "waitlist" ? "3px solid #6f42c1" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            📋 Waitlist
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            style={{
              padding: "15px 30px",
              backgroundColor: activeTab === "reports" ? "#28a745" : "transparent",
              color: activeTab === "reports" ? "white" : "#666",
              border: "none",
              borderBottom: activeTab === "reports" ? "3px solid #28a745" : "3px solid transparent",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s"
            }}
          >
            📊 Reports
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ 
        padding: "30px 20px", 
        maxWidth: "1200px", 
        margin: "0 auto"
      }}>
        
        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "20px",
          marginBottom: "40px"
        }}>
          <div style={{ 
            backgroundColor: "white", 
            padding: "25px", 
            borderRadius: "10px",
            border: "1px solid #dee2e6",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#28a745", margin: "0 0 10px 0", fontSize: "18px" }}>🚌 Active Buses</h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>12</p>
          </div>
          
          <div style={{ 
            backgroundColor: "white", 
            padding: "25px", 
            borderRadius: "10px",
            border: "1px solid #dee2e6",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#17a2b8", margin: "0 0 10px 0", fontSize: "18px" }}>💺 Total Seats</h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>336</p>
          </div>
          
          <div style={{ 
            backgroundColor: "white", 
            padding: "25px", 
            borderRadius: "10px",
            border: "1px solid #dee2e6",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#ffc107", margin: "0 0 10px 0", fontSize: "18px" }}>⏳ Pending</h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>8</p>
          </div>
          
          <div style={{ 
            backgroundColor: "white", 
            padding: "25px", 
            borderRadius: "10px",
            border: "1px solid #dee2e6",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#28a745", margin: "0 0 10px 0", fontSize: "18px" }}>✅ Available</h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#333" }}>289</p>
          </div>
        </div>



        {/* Quick Actions */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "30px", 
          borderRadius: "10px",
          border: "1px solid #dee2e6",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ marginBottom: "20px", color: "#333", fontSize: "24px" }}>
            ⚡ Quick Actions
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "15px"
          }}>
            <button
              style={{
                padding: "20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => toast.info("Feature coming soon!")}
            >
              <div style={{ fontSize: "20px", marginBottom: "5px" }}>📊</div>
              View All Reservations
            </button>
            
            <button
              style={{
                padding: "20px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => toast.info("Feature coming soon!")}
            >
              <div style={{ fontSize: "20px", marginBottom: "5px" }}>🚌</div>
              Manage Buses
            </button>
            
            <button
              style={{
                padding: "20px",
                backgroundColor: "#ffc107",
                color: "#212529",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => toast.info("Feature coming soon!")}
            >
              <div style={{ fontSize: "20px", marginBottom: "5px" }}>⏳</div>
              Pending Approvals
            </button>
            
            <button
              style={{
                padding: "20px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => window.open("http://localhost:5173", "_blank")}
            >
              <div style={{ fontSize: "20px", marginBottom: "5px" }}>👀</div>
              View Parent Portal
            </button>
          </div>
        </div>
        </>
        )}

        {activeTab === "routes" && (
          <RouteManagement />
        )}

        {activeTab === "buses" && (
          <BusRouteManagement />
        )}

        {activeTab === "pending" && (
          <PendingSeatManagement />
        )}

        {activeTab === "waitlist" && (
          <WaitlistManagement />
        )}

        {activeTab === "reports" && (
          <Reports />
        )}
      </main>
    </div>
  );
};

export default Dashboard;