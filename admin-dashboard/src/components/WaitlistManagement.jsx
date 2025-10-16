import React, { useState, useEffect } from "react";
import { getAllWaitlists, cancelWaitlistEntry } from "../services/api";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WaitlistManagement = () => {
  const [waitlists, setWaitlists] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWaitlists();
  }, []);

  const loadWaitlists = async () => {
    try {
      setLoading(true);
      const response = await getAllWaitlists();
      console.log("Waitlist response:", response); // Debug log
      
      // Transform the flat array into grouped format by bus
      const waitlistEntries = response.waitlistEntries || [];
      const groupedWaitlists = {};
      
      waitlistEntries.forEach(entry => {
        const busID = entry.busID;
        if (!groupedWaitlists[busID]) {
          groupedWaitlists[busID] = {
            regular: [],
            temporary: [],
            busDetails: entry.busDetails
          };
        }
        
        if (entry.reservationType === "Regular") {
          groupedWaitlists[busID].regular.push(entry);
        } else {
          groupedWaitlists[busID].temporary.push(entry);
        }
      });
      
      // Sort by priority within each group
      Object.values(groupedWaitlists).forEach(busData => {
        busData.regular.sort((a, b) => a.priority - b.priority);
        busData.temporary.sort((a, b) => a.priority - b.priority);
      });
      
      setWaitlists(groupedWaitlists);
    } catch (error) {
      toast.error("Failed to load waitlists");
      console.error("Waitlist load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEntry = async (waitlistID) => {
    if (!window.confirm("Are you sure you want to cancel this waitlist entry?")) {
      return;
    }

    try {
      await cancelWaitlistEntry(waitlistID);
      toast.success("Waitlist entry cancelled");
      loadWaitlists();
    } catch (error) {
      toast.error(error.message || "Failed to cancel waitlist entry");
    }
  };

  const handleNotifyNext = async (busID) => {
    if (!window.confirm("Notify the next person in the waitlist that a seat is available?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/waitlist/notify-next/${encodeURIComponent(busID)}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to notify next person");
      }

      toast.success("Next person in waitlist has been notified!");
      loadWaitlists();
    } catch (error) {
      toast.error(error.message || "Failed to notify next person");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityBadge = (studentType, priority) => {
    const isHighPriority = studentType === "Regular";
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
          backgroundColor: isHighPriority ? "#28a745" : "#ffc107",
          color: isHighPriority ? "white" : "black"
        }}
      >
        {studentType} (Priority: {priority})
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading waitlists...</div>;
  }

  const totalEntries = Object.values(waitlists).reduce((sum, busData) => {
    return sum + busData.regular.length + busData.temporary.length;
  }, 0);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Waitlist Management</h2>
      
      {/* Summary Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "15px", 
        marginBottom: "30px" 
      }}>
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px", 
          textAlign: "center" 
        }}>
          <h4>Total Waitlist Entries</h4>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>{totalEntries}</p>
        </div>
        
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px", 
          textAlign: "center" 
        }}>
          <h4>Buses with Waitlists</h4>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
            {Object.keys(waitlists).length}
          </p>
        </div>
      </div>

      {totalEntries === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <h3>No active waitlist entries</h3>
          <p>Students will appear here when they join waitlists for full buses.</p>
        </div>
      ) : (
        Object.entries(waitlists).map(([busID, busData]) => (
          <div key={busID} style={{ 
            marginBottom: "30px", 
            border: "1px solid #ddd", 
            borderRadius: "8px", 
            overflow: "hidden" 
          }}>
            <div style={{ 
              backgroundColor: "#007bff", 
              color: "white", 
              padding: "15px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0" }}>
                  🚌 {busData.busDetails?.busNumber || busID}
                </h3>
                <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
                  ID: {busID} | Driver: {busData.busDetails?.driverName || "Unknown"}
                </p>
              </div>
              <div>
                <span style={{ marginRight: "15px" }}>
                  Regular: {busData.regular.length}
                </span>
                <span>
                  Temporary: {busData.temporary.length}
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex" }}>
              {/* Regular Students Table */}
              <div style={{ flex: 1, borderRight: "1px solid #ddd" }}>
                <div style={{ 
                  backgroundColor: "#28a745", 
                  color: "white", 
                  padding: "10px", 
                  textAlign: "center",
                  fontWeight: "bold"
                }}>
                  Regular Students ({busData.regular.length})
                </div>
                
                {busData.regular.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Position</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Student ID</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Status</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Joined</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {busData.regular.map((entry, index) => (
                        <tr key={entry._id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "8px", fontWeight: "bold", fontSize: "12px" }}>#{entry.priority || index + 1}</td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>{entry.studentID}</td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "10px",
                              backgroundColor: entry.status === "Waiting" ? "#ffc107" : entry.status === "Notified" ? "#28a745" : "#6c757d",
                              color: "white"
                            }}>
                              {entry.status || "Waiting"}
                            </span>
                          </td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>{formatDate(entry.createdAt)}</td>
                          <td style={{ padding: "8px" }}>
                            <button
                              onClick={() => handleCancelEntry(entry.waitlistID)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px"
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    No regular students in waitlist
                  </div>
                )}
              </div>

              {/* Temporary Students Table */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  backgroundColor: "#ffc107", 
                  color: "black", 
                  padding: "10px", 
                  textAlign: "center",
                  fontWeight: "bold"
                }}>
                  Temporary Students ({busData.temporary.length})
                </div>
                
                {busData.temporary.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Position</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Student ID</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Status</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Duration</th>
                        <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd", fontSize: "12px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {busData.temporary.map((entry, index) => (
                        <tr key={entry._id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "8px", fontWeight: "bold", fontSize: "12px" }}>#{entry.priority || index + 1}</td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>{entry.studentID}</td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "10px",
                              backgroundColor: entry.status === "Waiting" ? "#ffc107" : entry.status === "Notified" ? "#28a745" : "#6c757d",
                              color: "white"
                            }}>
                              {entry.status || "Waiting"}
                            </span>
                          </td>
                          <td style={{ padding: "8px", fontSize: "12px" }}>{entry.daysRequested || 'N/A'} days</td>
                          <td style={{ padding: "8px" }}>
                            <button
                              onClick={() => handleCancelEntry(entry.waitlistID)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px"
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    No temporary students in waitlist
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <div style={{ 
        marginTop: "30px", 
        padding: "15px", 
        backgroundColor: "#e7f3ff", 
        borderRadius: "8px",
        fontSize: "14px",
        color: "#0c5aa6"
      }}>
        <h4>How the waitlist works:</h4>
        <ul>
          <li>Students are automatically added to waitlists when all seats are occupied</li>
          <li>Regular students have higher priority (100) than Temporary students (50)</li>
          <li>Within same priority, first-come-first-served applies</li>
          <li>Regular and Temporary students are shown in separate tables</li>
          <li>Students will be notified in priority order when seats become available</li>
        </ul>
      </div>
    </div>
  );
};

export default WaitlistManagement;