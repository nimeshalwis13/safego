import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStudentWaitlist, cancelWaitlistEntry } from "../services/api";
import toast from "react-hot-toast";
import "../styles/waitlist.css";

const StudentWaitlistPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentID = searchParams.get("studentID") || "STUDENT001";
  
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadWaitlistEntries();
  }, [studentID]);

  const loadWaitlistEntries = async () => {
    try {
      setLoading(true);
      const result = await getStudentWaitlist(studentID);
      setWaitlistEntries(result.waitlistEntries || []);
    } catch (error) {
      toast.error("Failed to load waitlist entries");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (waitlistID) => {
    try {
      setCancellingId(waitlistID);
      await cancelWaitlistEntry(waitlistID, studentID);
      toast.success("Waitlist entry cancelled successfully");
      
      // Remove from local state
      setWaitlistEntries(prev => 
        prev.filter(entry => entry.waitlistID !== waitlistID)
      );
    } catch (error) {
      toast.error(error.message || "Failed to cancel waitlist entry");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Waiting": return "#ffc107";
      case "Notified": return "#28a745";
      case "Cancelled": return "#6c757d";
      case "Expired": return "#dc3545";
      default: return "#007bff";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Loading waitlist entries...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "15px"
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: 0 }}>My Waitlist ({studentID})</h1>
      </div>

      {waitlistEntries.length === 0 ? (
        <div style={{
          backgroundColor: "#d1ecf1",
          border: "1px solid #bee5eb",
          padding: "20px",
          borderRadius: "5px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#0c5460" }}>No Waitlist Entries</h3>
          <p style={{ margin: 0, color: "#0c5460" }}>
            You are not currently on any waitlists.
          </p>
          <button
            onClick={() => navigate(`/seat-reservation?studentID=${studentID}`)}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Browse Available Seats
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            You have {waitlistEntries.length} waitlist {waitlistEntries.length === 1 ? 'entry' : 'entries'}
          </p>
          
          <div style={{ display: "grid", gap: "15px" }}>
            {waitlistEntries.map((entry) => (
              <div
                key={entry.waitlistID}
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  padding: "20px",
                  backgroundColor: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                      🚌 {entry.busDetails?.busNumber || entry.busID}
                    </h3>
                    <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "14px" }}>
                      Route: {entry.routeDetails?.name || entry.routeID}
                    </p>
                    <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "14px" }}>
                      Waitlist ID: {entry.waitlistID}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(entry.status),
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {entry.status}
                    </span>
                    {entry.currentPosition && (
                      <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
                        Position: #{entry.currentPosition}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  <div>
                    <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                      <strong>Reservation Type:</strong> {entry.reservationType}
                    </p>
                    <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                      <strong>Requested Date:</strong> {formatDate(entry.requestedDate)}
                    </p>
                    <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                      <strong>Days Requested:</strong> {entry.daysRequested}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                      <strong>Joined:</strong> {formatDate(entry.createdAt)}
                    </p>
                    {entry.notifiedAt && (
                      <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                        <strong>Notified:</strong> {formatDate(entry.notifiedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {entry.status === "Notified" && (
                  <div style={{
                    backgroundColor: "#d4edda",
                    border: "1px solid #c3e6cb",
                    padding: "10px",
                    borderRadius: "4px",
                    marginBottom: "15px"
                  }}>
                    <p style={{ margin: "0", fontSize: "14px", color: "#155724", fontWeight: "bold" }}>
                      🎉 Great news! A seat is available for you!
                    </p>
                    <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#155724" }}>
                      Please complete your reservation soon as this notification will expire.
                    </p>
                  </div>
                )}

                {(entry.status === "Waiting" || entry.status === "Notified") && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    {entry.status === "Notified" && (
                      <button
                        onClick={() => navigate(`/seat-reservation?studentID=${studentID}`)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Book Now
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(entry.waitlistID)}
                      disabled={cancellingId === entry.waitlistID}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: cancellingId === entry.waitlistID ? "not-allowed" : "pointer",
                        fontSize: "14px"
                      }}
                    >
                      {cancellingId === entry.waitlistID ? "Cancelling..." : "Cancel Waitlist"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWaitlistPage;