import React, { useState } from "react";
import { generateSeatsForBus } from "../services/api";
import toast from "react-hot-toast";
import "../styles/admin-dashboard.css";

const SchoolAdminDashboard = () => {
  const [busID, setBusID] = useState("");
  const [totalSeats, setTotalSeats] = useState(28);
  const [generating, setGenerating] = useState(false);

  // Handle generate seats
  const handleGenerateSeats = async (e) => {
    e.preventDefault();
    
    if (!busID.trim()) {
      toast.error("Please enter a Bus ID");
      return;
    }

    setGenerating(true);
    
    try {
      const result = await generateSeatsForBus({ 
        busID: busID.trim(), 
        totalSeats: parseInt(totalSeats) 
      });
      toast.success(result.message);
      // Reset form
      setBusID("");
      setTotalSeats(28);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "800px", 
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
        borderRadius: "10px",
        textAlign: "center",
        marginBottom: "30px"
      }}>
        <h1>🏫 School Admin Dashboard</h1>
        <p>Manage buses and seat configurations</p>
      </div>

      {/* Dashboard Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "10px",
          border: "1px solid #dee2e6",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#28a745", margin: "0 0 10px 0" }}>Active Buses</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>12</p>
        </div>
        
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "10px",
          border: "1px solid #dee2e6",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#17a2b8", margin: "0 0 10px 0" }}>Total Seats</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>336</p>
        </div>
        
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "10px",
          border: "1px solid #dee2e6",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#ffc107", margin: "0 0 10px 0" }}>Pending</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>5</p>
        </div>
        
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "10px",
          border: "1px solid #dee2e6",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#dc3545", margin: "0 0 10px 0" }}>Available</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>289</p>
        </div>
      </div>

      {/* Generate Seats Section */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "30px", 
        borderRadius: "10px",
        border: "1px solid #dee2e6",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>🚌 Generate Bus Seats</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Create seat configurations for new buses or reset existing bus seats.
        </p>
        
        <form onSubmit={handleGenerateSeats}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "20px",
            marginBottom: "20px"
          }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "bold",
                color: "#333"
              }}>
                Bus ID *
              </label>
              <input
                type="text"
                value={busID}
                onChange={(e) => setBusID(e.target.value)}
                placeholder="e.g., SGB001"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "bold",
                color: "#333"
              }}>
                Total Seats
              </label>
              <input
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                min="1"
                max="50"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={generating}
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: generating ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: generating ? "not-allowed" : "pointer",
              transition: "background-color 0.3s"
            }}
          >
            {generating ? "⏳ Generating Seats..." : "🚌 Generate Seats"}
          </button>
        </form>
        
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: "#e3f2fd",
          border: "1px solid #bbdefb",
          borderRadius: "5px"
        }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#1976d2" }}>
            💡 <strong>Note:</strong> If seats already exist for this bus, the operation will be rejected. 
            Each bus can only have its seats generated once.
          </p>
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
        <h2 style={{ marginBottom: "20px", color: "#333" }}>⚡ Quick Actions</h2>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px"
        }}>
          <button
            style={{
              padding: "15px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={() => toast.info("Feature coming soon!")}
          >
            📊 View All Reservations
          </button>
          
          <button
            style={{
              padding: "15px",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={() => toast.info("Feature coming soon!")}
          >
            🚌 Manage Buses
          </button>
          
          <button
            style={{
              padding: "15px",
              backgroundColor: "#ffc107",
              color: "#212529",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={() => toast.info("Feature coming soon!")}
          >
            ⏳ Pending Approvals
          </button>
          
          <button
            style={{
              padding: "15px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={() => window.open("/", "_blank")}
          >
            👀 View Parent Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;