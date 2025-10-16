import React, { useState, useEffect } from 'react';

const PendingSeatManagement = () => {
  const [pendingData, setPendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingSeats();
  }, []);

  const fetchPendingSeats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/expired-reservations/admin/pending-summary');
      if (!response.ok) throw new Error('Failed to fetch pending seats');
      const data = await response.json();
      setPendingData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactStudent = async (studentData, contactMethod) => {
    try {
      const response = await fetch('http://localhost:5000/api/expired-reservations/admin/contact-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentID: studentData.studentID,
          busID: studentData.busID,
          seatNumber: studentData.seatNumber,
          contactMethod: contactMethod,
          notes: `Contacting for ${studentData.seasonType} plan renewal`
        })
      });
      
      if (response.ok) {
        alert(`Contact logged for ${studentData.studentName} via ${contactMethod}`);
      }
    } catch (err) {
      alert('Failed to log contact attempt');
    }
  };

  const handleReleaseSeat = async (busID, seatNumber) => {
    if (!confirm(`Are you sure you want to release seat ${seatNumber} on bus ${busID}?`)) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/expired-reservations/release-pending-seats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busID, seatNumbers: [seatNumber] })
      });
      
      if (response.ok) {
        alert('Seat released successfully');
        fetchPendingSeats(); // Refresh data
      }
    } catch (err) {
      alert('Failed to release seat');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff4757';
      case 'Medium': return '#ffa502';
      case 'Low': return '#26de81';
      default: return '#747d8c';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading pending seats...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Error: {error}</div>;
  if (!pendingData) return <div style={{ textAlign: 'center', padding: '20px' }}>No data available</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🚌 Pending Seat Renewals</h2>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{pendingData.summary.totalPendingSeats}</h3>
          <p style={{ margin: 0 }}>Total Pending Seats</p>
        </div>
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{pendingData.summary.highPriorityRenewals}</h3>
          <p style={{ margin: 0 }}>High Priority (≤7 days)</p>
        </div>
        <div style={{ backgroundColor: '#27ae60', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{pendingData.summary.totalBuses}</h3>
          <p style={{ margin: 0 }}>Buses Affected</p>
        </div>
      </div>

      {/* Bus-wise Pending Seats */}
      {Object.keys(pendingData.busSummary).map(busID => (
        <div key={busID} style={{ marginBottom: '30px', backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#34495e', color: 'white', padding: '15px' }}>
            <h3 style={{ margin: 0 }}>🚍 Bus {busID} - {pendingData.busSummary[busID].length} Pending Seats</h3>
          </div>
          
          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Seat</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Contact</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Plan</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Days Expired</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingData.busSummary[busID].map(seat => (
                  <tr key={`${busID}-${seat.seatNumber}`} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{seat.seatNumber}</td>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <strong>{seat.studentName}</strong>
                        <br />
                        <small style={{ color: '#7f8c8d' }}>{seat.studentID}</small>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '12px' }}>
                        <div>📱 {seat.phone}</div>
                        <div>👨‍👩‍👧‍👦 {seat.parentPhone}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        backgroundColor: seat.seasonType === 'Monthly' ? '#3498db' : '#9b59b6', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {seat.seasonType}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: getPriorityColor(seat.priority), 
                        fontWeight: 'bold' 
                      }}>
                        {seat.daysExpired} days
                      </span>
                      <br />
                      <small style={{ color: '#7f8c8d' }}>
                        ({seat.priority} Priority)
                      </small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                        <button
                          onClick={() => handleContactStudent({ ...seat, busID }, 'Phone')}
                          style={{
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          📞 Call
                        </button>
                        <button
                          onClick={() => handleReleaseSeat(busID, seat.seatNumber)}
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          🔓 Release
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {Object.keys(pendingData.busSummary).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#d5edda', 
          borderRadius: '8px',
          color: '#155724'
        }}>
          <h3>🎉 No Pending Seats!</h3>
          <p>All regular student reservations are current or have been processed.</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={fetchPendingSeats}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default PendingSeatManagement;