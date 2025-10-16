import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createRoute, getAllRoutes, deleteRoute } from "../services/api";

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    id: "",
    name: "",
    description: "",
    stops: [{ name: "", order: 1, estimatedTime: "" }]
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const result = await getAllRoutes();
      setRoutes(result.routes);
    } catch (error) {
      toast.error("Failed to fetch routes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStopChange = (index, field, value) => {
    const updatedStops = [...newRoute.stops];
    updatedStops[index] = {
      ...updatedStops[index],
      [field]: field === 'order' ? parseInt(value) || 1 : value
    };
    setNewRoute(prev => ({
      ...prev,
      stops: updatedStops
    }));
  };

  const addStop = () => {
    const nextOrder = newRoute.stops.length + 1;
    setNewRoute(prev => ({
      ...prev,
      stops: [...prev.stops, { name: "", order: nextOrder, estimatedTime: "" }]
    }));
  };

  const removeStop = (index) => {
    if (newRoute.stops.length > 1) {
      const updatedStops = newRoute.stops.filter((_, i) => i !== index);
      // Reorder the remaining stops
      updatedStops.forEach((stop, i) => {
        stop.order = i + 1;
      });
      setNewRoute(prev => ({
        ...prev,
        stops: updatedStops
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newRoute.id.trim() || !newRoute.name.trim()) {
      toast.error("Route ID and Name are required");
      return;
    }

    if (newRoute.stops.some(stop => !stop.name.trim())) {
      toast.error("All stops must have a name");
      return;
    }

    try {
      setLoading(true);
      await createRoute(newRoute);
      toast.success("Route created successfully!");
      
      // Reset form
      setNewRoute({
        id: "",
        name: "",
        description: "",
        stops: [{ name: "", order: 1, estimatedTime: "" }]
      });
      setShowAddForm(false);
      
      // Refresh routes list
      fetchRoutes();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteRoute(routeId);
        toast.success("Route deleted successfully!");
        fetchRoutes();
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
        <h2 style={{ color: "#333", margin: 0 }}>🚌 Route Management</h2>
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
          {showAddForm ? "Cancel" : "+ Add New Route"}
        </button>
      </div>

      {/* Add Route Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "30px",
          border: "1px solid #dee2e6"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Add New Route</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                  Route ID *
                </label>
                <input
                  type="text"
                  name="id"
                  value={newRoute.id}
                  onChange={handleInputChange}
                  placeholder="e.g., R001, R002"
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
                  Route Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newRoute.name}
                  onChange={handleInputChange}
                  placeholder="e.g., City Center Route"
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

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Description
              </label>
              <textarea
                name="description"
                value={newRoute.description}
                onChange={handleInputChange}
                placeholder="Optional route description"
                rows="3"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Stops Section */}
            <div style={{ marginBottom: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <label style={{ fontWeight: "600", color: "#333", fontSize: "16px" }}>
                  Route Stops *
                </label>
                <button
                  type="button"
                  onClick={addStop}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  + Add Stop
                </button>
              </div>

              {newRoute.stops.map((stop, index) => (
                <div key={index} style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 150px 80px",
                  gap: "15px",
                  alignItems: "end",
                  marginBottom: "15px",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px"
                }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#666" }}>
                      Order
                    </label>
                    <input
                      type="number"
                      value={stop.order}
                      onChange={(e) => handleStopChange(index, 'order', e.target.value)}
                      min="1"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "3px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#666" }}>
                      Stop Name *
                    </label>
                    <input
                      type="text"
                      value={stop.name}
                      onChange={(e) => handleStopChange(index, 'name', e.target.value)}
                      placeholder="e.g., Main Street, School Gate"
                      required
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "3px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#666" }}>
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={stop.estimatedTime}
                      onChange={(e) => handleStopChange(index, 'estimatedTime', e.target.value)}
                      placeholder="e.g., 7:30 AM"
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "3px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    disabled={newRoute.stops.length === 1}
                    style={{
                      padding: "8px",
                      backgroundColor: newRoute.stops.length === 1 ? "#6c757d" : "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: newRoute.stops.length === 1 ? "not-allowed" : "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
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
                {loading ? "Creating..." : "Create Route"}
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

      {/* Routes List */}
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
          <h3 style={{ margin: 0, color: "#333" }}>Existing Routes</h3>
        </div>

        <div style={{ padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Loading routes...
            </div>
          ) : routes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              No routes found. Create your first route!
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {routes.map((route) => (
                <div key={route.id} style={{
                  padding: "20px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>
                        {route.name} <span style={{ color: "#666", fontSize: "14px" }}>({route.id})</span>
                      </h4>
                      {route.description && (
                        <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "14px" }}>
                          {route.description}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                        Created by: {route.createdBy} | {new Date(route.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(route.id)}
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

                  <div>
                    <strong style={{ color: "#333", fontSize: "14px" }}>Stops:</strong>
                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {route.stops
                        .sort((a, b) => a.order - b.order)
                        .map((stop, index) => (
                          <div key={index} style={{
                            padding: "5px 10px",
                            backgroundColor: "#007bff",
                            color: "white",
                            borderRadius: "15px",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                          }}>
                            <span style={{ fontWeight: "600" }}>{stop.order}.</span>
                            <span>{stop.name}</span>
                            {stop.estimatedTime && (
                              <span style={{ opacity: 0.8 }}>({stop.estimatedTime})</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteManagement;