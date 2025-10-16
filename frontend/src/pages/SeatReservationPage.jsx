import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import SeatMap from "../components/SeatMap";
import { getAllRoutes, getBusesByRoute } from "../services/api";
import "../styles/seat-reservation.css";

const SeatReservationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentType = searchParams.get("type") || "Student";
  const studentID = searchParams.get("studentID") || "STUDENT001"; // Get studentID from URL or default
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busesLoading, setBusesLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [availableBuses, setAvailableBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);

  // Fetch routes from backend on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const result = await getAllRoutes();
        setRoutes(result.routes || []);
      } catch (error) {
        console.error("Failed to fetch routes:", error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Handle route selection → fetch buses for selected route
  const handleRouteChange = async (e) => {
    const routeID = e.target.value;
    setSelectedRoute(routeID);
    setSelectedBus(null); // reset bus when route changes
    
    // Store route ID in sessionStorage for waitlist form
    if (routeID) {
      sessionStorage.setItem('selectedRouteID', routeID);
    } else {
      sessionStorage.removeItem('selectedRouteID');
    }
    
    if (!routeID) {
      setAvailableBuses([]);
      return;
    }

    try {
      setBusesLoading(true);
      const result = await getBusesByRoute(routeID);
      setAvailableBuses(result.buses || []);
    } catch (error) {
      console.error("Failed to fetch buses for route:", error);
      setAvailableBuses([]);
      
    } finally {
      setBusesLoading(false);
    }
  };

  // Handle return from payment success - restore previous bus selection
  useEffect(() => {
    const stateData = location.state;
    if (stateData) {
      // Show message if available (could be implemented with toast notifications)
      if (stateData.message) {
        // Future: Show toast notification for return messages
      }
      
      // Restore bus selection if returning from payment
      if (stateData.returnToBus && stateData.selectedBusInfo) {
        const busInfo = stateData.selectedBusInfo;
        
        // Set the route first
        setSelectedRoute(busInfo.routeId);
        // Fetch buses for that route
        getBusesByRoute(busInfo.routeId).then(result => {
          const fetchedBuses = result.buses || [];
          setAvailableBuses(fetchedBuses);
          
          // Find and set the selected bus
          const foundBus = fetchedBuses.find(b => b.busID === busInfo.busID);
          if (foundBus) {
            setSelectedBus(foundBus);
          }
        }).catch(error => {
          console.error("Failed to restore bus selection:", error);
        });
      }
    }
  }, [location.state]);



  return (
    <div style={{ 
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Header Section */}
      <div style={{
        background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
        color: "white",
        padding: "30px 20px",
        boxShadow: "0 4px 20px rgba(0,123,255,0.15)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "10px 20px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "20px",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: "28px", 
            fontWeight: "700",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            🚌 Seat Reservation
          </h1>
          <p style={{ 
            margin: "8px 0 0 0", 
            opacity: 0.9, 
            fontSize: "16px",
            fontWeight: "400"
          }}>
            {studentType} Student - {studentID}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "40px 20px" 
      }}>
        {/* Step 1: Route Selection Card */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
          marginBottom: "30px"
        }}>
          <div style={{ marginBottom: "25px" }}>
            <h2 style={{ 
              margin: "0 0 8px 0", 
              color: "#2c3e50", 
              fontSize: "22px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ 
                background: "linear-gradient(135deg, #007bff, #0056b3)",
                color: "white",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "bold",
                marginRight: "12px"
              }}>
                1
              </span>
              Select Your Route
            </h2>
            <p style={{ 
              margin: 0, 
              color: "#6c757d", 
              fontSize: "15px",
              marginLeft: "44px"
            }}>
              Choose the bus route that matches your journey
            </p>
          </div>

          <div style={{ marginLeft: "44px" }}>
            <label style={{
              display: "block",
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500",
              color: "#495057"
            }}>
              Available Routes
            </label>
            <select 
              value={selectedRoute} 
              onChange={handleRouteChange} 
              disabled={loading}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "15px 20px",
                fontSize: "16px",
                border: "2px solid #e9ecef",
                borderRadius: "12px",
                backgroundColor: loading ? "#f8f9fa" : "white",
                color: loading ? "#6c757d" : "#495057",
                cursor: loading ? "not-allowed" : "pointer",
                outline: "none",
                transition: "all 0.3s ease",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23666\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 15px center",
                backgroundSize: "12px"
              }}
              onFocus={(e) => e.target.style.borderColor = "#007bff"}
              onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
            >
              <option value="">
                {loading ? "🔄 Loading routes..." : "📍 Choose a Route"}
              </option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  🛣️ {r.name}
                </option>
              ))}
            </select>
            
            {routes.length === 0 && !loading && (
              <div style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "20px", marginRight: "10px" }}>⚠️</span>
                <p style={{ margin: 0, color: "#856404", fontSize: "15px" }}>
                  No routes available. Please contact admin to add routes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Bus Selection Card */}
        {selectedRoute && (
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
            marginBottom: "30px"
          }}>
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ 
                margin: "0 0 8px 0", 
                color: "#2c3e50", 
                fontSize: "22px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center"
              }}>
                <span style={{ 
                  background: "linear-gradient(135deg, #28a745, #20c997)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginRight: "12px"
                }}>
                  2
                </span>
                Choose Your Bus
              </h2>
              <p style={{ 
                margin: 0, 
                color: "#6c757d", 
                fontSize: "15px",
                marginLeft: "44px"
              }}>
                Available buses for <strong>{routes.find(r => r.id === selectedRoute)?.name}</strong>
              </p>
            </div>

            <div style={{ marginLeft: "44px" }}>
              {busesLoading ? (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  padding: "40px",
                  color: "#6c757d"
                }}>
                  <div style={{ marginRight: "15px", fontSize: "20px" }}>🔄</div>
                  <span style={{ fontSize: "16px" }}>Loading buses...</span>
                </div>
              ) : availableBuses.length > 0 ? (
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                  gap: "20px",
                  marginTop: "15px" 
                }}>
                  {availableBuses.map((bus) => (
                    <div
                      key={bus.busID}
                      onClick={() => setSelectedBus(bus)}
                      style={{
                        padding: "20px",
                        border: selectedBus?.busID === bus.busID 
                          ? "2px solid #28a745" 
                          : "2px solid #e9ecef",
                        borderRadius: "12px",
                        cursor: "pointer",
                        background: selectedBus?.busID === bus.busID 
                          ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)" 
                          : "white",
                        color: selectedBus?.busID === bus.busID ? "white" : "#495057",
                        transition: "all 0.3s ease",
                        boxShadow: selectedBus?.busID === bus.busID 
                          ? "0 8px 25px rgba(40,167,69,0.25)" 
                          : "0 2px 8px rgba(0,0,0,0.08)",
                        transform: selectedBus?.busID === bus.busID ? "translateY(-2px)" : "translateY(0)",
                        position: "relative",
                        overflow: "hidden"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBus?.busID !== bus.busID) {
                          e.target.style.borderColor = "#007bff";
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 4px 15px rgba(0,123,255,0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBus?.busID !== bus.busID) {
                          e.target.style.borderColor = "#e9ecef";
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                        }
                      }}
                    >
                      {selectedBus?.busID === bus.busID && (
                        <div style={{
                          position: "absolute",
                          top: "15px",
                          right: "15px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px"
                        }}>
                          ✓
                        </div>
                      )}
                      
                      <div style={{ marginBottom: "15px" }}>
                        <h3 style={{ 
                          margin: "0 0 8px 0", 
                          fontSize: "20px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <span style={{ marginRight: "8px", fontSize: "24px" }}>🚌</span>
                          {bus.busNumber}
                        </h3>
                        <div style={{ 
                          fontSize: "12px", 
                          opacity: selectedBus?.busID === bus.busID ? 0.9 : 0.7,
                          fontWeight: "500",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          ID: {bus.busID}
                        </div>
                      </div>

                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "10px",
                        fontSize: "14px",
                        opacity: selectedBus?.busID === bus.busID ? 0.95 : 0.8
                      }}>
                        <div>
                          <div style={{ fontWeight: "500", marginBottom: "3px" }}>👨‍✈️ Driver</div>
                          <div>{bus.driverName}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: "500", marginBottom: "3px" }}>💺 Seats</div>
                          <div>{bus.totalSeats} seats</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                  border: "1px solid #ffeaa7",
                  padding: "25px",
                  borderRadius: "12px",
                  marginTop: "15px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "48px", marginBottom: "15px" }}>🚫</div>
                  <h3 style={{ margin: "0 0 10px 0", color: "#856404", fontSize: "18px", fontWeight: "600" }}>
                    No Buses Available
                  </h3>
                  <p style={{ margin: 0, color: "#856404", fontSize: "15px", lineHeight: "1.5" }}>
                    No buses are currently available for this route.<br/>
                    Please contact the school admin to add buses to this route.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Seat Map Card */}
        {selectedBus && (
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div style={{ marginBottom: "25px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
                <h2 style={{ 
                  margin: 0, 
                  color: "#2c3e50", 
                  fontSize: "22px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <span style={{ 
                    background: "linear-gradient(135deg, #6f42c1, #e83e8c)",
                    color: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginRight: "12px"
                  }}>
                    3
                  </span>
                  Select Your Seat
                </h2>
                
                <button
                  onClick={() => {
                    setSelectedBus(null);
                    setSelectedRoute("");
                    setAvailableBuses([]);
                  }}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#5a6268";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#6c757d";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  ← Back to Bus Selection
                </button>
              </div>
              
              <div style={{ marginLeft: "44px" }}>
                <p style={{ 
                  margin: "0 0 25px 0", 
                  color: "#6c757d", 
                  fontSize: "15px"
                }}>
                  Seat map for <strong>{selectedBus.busNumber}</strong> ({selectedBus.busID})
                </p>
              </div>
            </div>
            
            <div style={{ marginLeft: "44px" }}>
              <SeatMap busID={selectedBus.busID} studentID={studentID} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatReservationPage;
