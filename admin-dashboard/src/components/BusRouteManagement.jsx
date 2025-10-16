import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:5000";

// API functions
const createBus = async (busData) => {
  const token = localStorage.getItem("adminToken");
  const response = await fetch(`${BASE_URL}/api/buses`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(busData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to create bus");
  }
  
  return result;
};

const getAllBuses = async () => {
  const token = localStorage.getItem("adminToken");
  const response = await fetch(`${BASE_URL}/api/buses`, {
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch buses");
  }
  
  return result;
};

const getAllRoutes = async () => {
  const token = localStorage.getItem("adminToken");
  const response = await fetch(`${BASE_URL}/api/routes`, {
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to fetch routes");
  }
  
  return result;
};

const deleteBus = async (busID) => {
  const token = localStorage.getItem("adminToken");
  const response = await fetch(`${BASE_URL}/api/buses/${busID}`, {
    method: "DELETE",
    headers: { 
      "Authorization": `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || "Failed to delete bus");
  }
  
  return result;
};

const BusRouteManagement = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBus, setNewBus] = useState({
    busID: "",
    busNumber: "",
    driverName: "",
    driverContact: "",
    totalSeats: 28,
    routeId: "",
    generateSeats: true
  });

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const result = await getAllBuses();
      setBuses(result.buses);
    } catch (error) {
      toast.error("Failed to fetch buses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const result = await getAllRoutes();
      setRoutes(result.routes);
    } catch (error) {
      toast.error("Failed to fetch routes");
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBus(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newBus.busID.trim() || !newBus.busNumber.trim() || !newBus.driverName.trim() || !newBus.routeId) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      await createBus(newBus);
      toast.success("Bus created successfully!");
      
      // Reset form
      setNewBus({
        busID: "",
        busNumber: "",
        driverName: "",
        driverContact: "",
        totalSeats: 28,
        routeId: "",
        generateSeats: true
      });
      setShowAddForm(false);
      
      // Refresh buses list
      fetchBuses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (busID) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await deleteBus(busID);
        toast.success("Bus deleted successfully!");
        fetchBuses();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
      }}>
        <h2 style={{ color: "#333", margin: 0 }}>🚌 Bus & Route Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          {showAddForm ? "Cancel" : "+ Add New Bus"}
        </button>
      </div>

      {/* Add Bus Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "30px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Add New Bus</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Bus ID *
                </label>
                <input
                  type="text"
                  name="busID"
                  value={newBus.busID}
                  onChange={handleInputChange}
                  placeholder="e.g., BUS001, BUS002"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "16px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Bus Number *
                </label>
                <input
                  type="text"
                  name="busNumber"
                  value={newBus.busNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., SB-001, ABC-123"
                  required
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Driver Name *
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={newBus.driverName}
                  onChange={handleInputChange}
                  placeholder="Driver's full name"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "16px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Driver Contact *
                </label>
                <input
                  type="text"
                  name="driverContact"
                  value={newBus.driverContact}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  required
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Select Route *
                </label>
                <select
                  name="routeId"
                  value={newBus.routeId}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    fontSize: "16px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">-- Select a Route --</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Total Seats
                </label>
                <input
                  type="number"
                  name="totalSeats"
                  value={newBus.totalSeats}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
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

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "flex", alignItems: "center", fontWeight: "600", color: "#333" }}>
                <input
                  type="checkbox"
                  name="generateSeats"
                  checked={newBus.generateSeats}
                  onChange={handleInputChange}
                  style={{ marginRight: "8px" }}
                />
                Auto-generate seats for this bus
              </label>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 30px",
                  backgroundColor: loading ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "16px"
                }}
              >
                {loading ? "Creating..." : "Create Bus"}
              </button>
              
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "16px"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buses List */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        border: "1px solid #dee2e6"
      }}>
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #dee2e6",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px 10px 0 0"
        }}>
          <h3 style={{ margin: 0, color: "#333" }}>Existing Buses</h3>
        </div>

        <div style={{ padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Loading buses...
            </div>
          ) : buses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No buses found. Create your first bus!
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {buses.map((bus) => (
                <div key={bus.busID} style={{
                  padding: "20px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>
                        🚌 {bus.busNumber} <span style={{ color: "#666", fontSize: "14px" }}>({bus.busID})</span>
                      </h4>
                      <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Driver:</strong> {bus.driverName} | <strong>Contact:</strong> {bus.driverContact}
                      </p>
                      <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>
                        <strong>Total Seats:</strong> {bus.totalSeats} | <strong>Status:</strong> 
                        <span style={{ 
                          color: bus.status === 'Active' ? '#28a745' : bus.status === 'Maintenance' ? '#ffc107' : '#dc3545',
                          fontWeight: '600',
                          marginLeft: '5px'
                        }}>
                          {bus.status}
                        </span>
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                        Created by: {bus.createdBy} | {new Date(bus.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(bus.busID)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Route Information */}
                  {bus.route && (
                    <div style={{
                      padding: "15px",
                      backgroundColor: "#e3f2fd",
                      borderRadius: "5px",
                      marginTop: "10px"
                    }}>
                      <h5 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>
                        📍 Assigned Route: {bus.route.name} ({bus.route.id})
                      </h5>
                      {bus.route.description && (
                        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#333" }}>
                          {bus.route.description}
                        </p>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {bus.route.stops
                          ?.sort((a, b) => a.order - b.order)
                          .map((stop, index) => (
                            <span key={index} style={{
                              padding: "4px 8px",
                              backgroundColor: "#1976d2",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "500"
                            }}>
                              {stop.order}. {stop.name}
                              {stop.estimatedTime && ` (${stop.estimatedTime})`}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusRouteManagement;