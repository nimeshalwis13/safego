import React, { useState, useEffect } from 'react';

const PendingSeatManagement = () => {
  const [pendingData, setPendingData] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBus, setFilterBus] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchPendingSeats();
    fetchAllBookings();
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

  const fetchAllBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seats/all-bookings');
      if (!response.ok) throw new Error('Failed to fetch all bookings');
      const data = await response.json();
      setAllBookings(data);
    } catch (err) {
      console.error('Error fetching all bookings:', err);
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
          notes: `Contacting for ${studentData.seasonType || 'seat'} plan renewal`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.contactDetails) {
          const contact = data.contactDetails;
          
          // Create a more user-friendly modal/alert with complete contact information
          const contactInfo = [
            `✅ Contact Details Retrieved Successfully!\n`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `👤 Student: ${contact.studentName || 'N/A'}`,
            `🆔 Student ID: ${contact.studentID || 'N/A'}`,
            ``,
            `📞 Contact Information:`,
            `   📱 Phone: ${contact.phone || 'Not available'}`,
            `   📧 Email: ${contact.email || 'Not available'}`,
            `   👨‍👩‍👧‍👦 Parent Phone: ${contact.parentPhone || 'Not available'}`,
            `   🚨 Emergency Contact: ${contact.emergencyContact || 'Not available'}`,
            ``,
            `🚌 Bus Information:`,
            `   Bus ID: ${contact.busID || 'N/A'}`,
            `   Seat Number: ${contact.seatNumber || 'N/A'}`,
            ``
          ];
          
          // Add reservation details if available
          if (contact.reservationDetails) {
            const resDetails = contact.reservationDetails;
            contactInfo.push(
              `📅 Reservation Details:`,
              `   Start Date: ${resDetails.startDate ? new Date(resDetails.startDate).toLocaleDateString() : 'N/A'}`,
              `   End Date: ${resDetails.endDate ? new Date(resDetails.endDate).toLocaleDateString() : 'N/A'}`,
              `   ⏰ Days Expired: ${resDetails.daysExpired || 0} days`,
              ``
            );
          }
          
          contactInfo.push(
            `📝 Contact Method: ${contactMethod}`,
            `⏱️ Logged at: ${new Date().toLocaleString()}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `💡 Tip: Use the phone numbers above to contact the student about their seat renewal.`
          );
          
          alert(contactInfo.join('\n'));
          
          // Refresh data after logging contact
          fetchPendingSeats();
          fetchAllBookings();
        } else {
          alert(`⚠️ Contact logged for ${studentData.studentName}, but details could not be retrieved.`);
        }
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to contact student: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error contacting student:', err);
      alert(`❌ Failed to log contact attempt: ${err.message}`);
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

  const handleRemoveBooking = async (busID, seatNumber, studentName) => {
    if (!confirm(`⚠️ Are you sure you want to REMOVE this booking?\n\nBus: ${busID}\nSeat: ${seatNumber}\nStudent: ${studentName}\n\nThis will release the seat and make it available for booking.`)) {
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/seats/remove-booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busID, seatNumber })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchAllBookings(); // Refresh all bookings
        fetchPendingSeats(); // Also refresh pending seats if affected
      } else {
        alert(`❌ Failed to remove booking: ${data.error}`);
      }
    } catch (err) {
      console.error('Error removing booking:', err);
      alert('❌ Failed to remove booking. Please try again.');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return '#27ae60';
      case 'Pending': return '#f39c12';
      case 'Available': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getStudentTypeColor = (type) => {
    return type === 'Regular' ? '#3498db' : '#e74c3c';
  };

  const groupBookingsByBus = (bookings) => {
    const grouped = {};
    bookings.forEach(booking => {
      if (!grouped[booking.busID]) {
        grouped[booking.busID] = [];
      }
      grouped[booking.busID].push(booking);
    });
    return grouped;
  };

  // Filter bookings based on search and filters
  const filterBookings = (bookings) => {
    return bookings.filter(booking => {
      // Search filter (Student ID, Name, Phone)
      const matchesSearch = searchTerm === '' || 
        booking.reservedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone?.includes(searchTerm) ||
        booking.seatNumber?.toString().includes(searchTerm);

      // Bus filter
      const matchesBus = filterBus === 'all' || booking.busID === filterBus;

      // Status filter
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

      // Student Type filter
      const matchesType = filterType === 'all' || booking.studentType === filterType;

      return matchesSearch && matchesBus && matchesStatus && matchesType;
    });
  };

  // Get unique bus IDs for filter dropdown
  const getUniqueBuses = () => {
    const buses = [...new Set(allBookings.map(b => b.busID))];
    return buses.sort();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading seat bookings...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Error: {error}</div>;

  const filteredBookings = filterBookings(allBookings);
  const groupedBookings = groupBookingsByBus(filteredBookings);
  const uniqueBuses = getUniqueBuses();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>🚌 Seat Bookings Management</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'all' ? '#3498db' : '#ecf0f1',
              color: viewMode === 'all' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📋 All Bookings
          </button>
          <button
            onClick={() => setViewMode('pending')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'pending' ? '#e74c3c' : '#ecf0f1',
              color: viewMode === 'pending' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ⏰ Pending Renewals {pendingData && `(${pendingData.summary.totalPendingSeats})`}
          </button>
        </div>
      </div>

      {/* Search and Filters - Only show in All Bookings view */}
      {viewMode === 'all' && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '16px' }}>🔍 Search & Filter</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {/* Search Input */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Student ID, Name, Phone, Seat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Bus Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                Bus
              </label>
              <select
                value={filterBus}
                onChange={(e) => setFilterBus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Buses</option>
                {uniqueBuses.map(busID => (
                  <option key={busID} value={busID}>{busID}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="Booked">Booked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Student Type Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                Student Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Types</option>
                <option value="Regular">Regular</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterBus !== 'all' || filterStatus !== 'all' || filterType !== 'all') && (
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBus('all');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Clear All Filters
              </button>
              <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666' }}>
                Showing {filteredBookings.length} of {allBookings.length} bookings
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* ALL BOOKINGS VIEW */}
      {viewMode === 'all' && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#3498db', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{filteredBookings.length}</h3>
              <p style={{ margin: 0 }}>{searchTerm || filterBus !== 'all' || filterStatus !== 'all' || filterType !== 'all' ? 'Filtered Bookings' : 'Total Bookings'}</p>
            </div>
            <div style={{ backgroundColor: '#27ae60', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {filteredBookings.filter(b => b.status === 'Booked').length}
              </h3>
              <p style={{ margin: 0 }}>Confirmed Bookings</p>
            </div>
            <div style={{ backgroundColor: '#f39c12', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {filteredBookings.filter(b => b.status === 'Pending').length}
              </h3>
              <p style={{ margin: 0 }}>Pending Bookings</p>
            </div>
            <div style={{ backgroundColor: '#9b59b6', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                {filteredBookings.filter(b => b.studentType === 'Temporary').length}
              </h3>
              <p style={{ margin: 0 }}>Temporary Students</p>
            </div>
          </div>

          {/* Bus-wise Bookings */}
          {Object.keys(groupedBookings).length > 0 ? (
            Object.keys(groupedBookings).map(busID => (
            <div key={busID} style={{ marginBottom: '30px', backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#34495e', color: 'white', padding: '15px' }}>
                <h3 style={{ margin: 0 }}>🚍 Bus {busID} - {groupedBookings[busID].length} Seats Booked</h3>
              </div>
              
              <div style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ecf0f1' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Seat</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Student ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Student Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Student Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Contact</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #bdc3c7' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBookings[busID].map(booking => (
                      <tr key={`${busID}-${booking.seatNumber}`} style={{ borderBottom: '1px solid #ecf0f1' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px' }}>{booking.seatNumber}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{booking.reservedBy}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong>{booking.studentName || 'N/A'}</strong>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            backgroundColor: getStudentTypeColor(booking.studentType), 
                            color: 'white', 
                            padding: '4px 10px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {booking.studentType || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            backgroundColor: getStatusColor(booking.status), 
                            color: 'white', 
                            padding: '4px 10px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          {booking.phone ? (
                            <>
                              <div>� {booking.phone}</div>
                              {booking.parentPhone && <div>👨‍👩‍👧‍👦 {booking.parentPhone}</div>}
                            </>
                          ) : (
                            <span style={{ color: '#95a5a6' }}>No contact</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => alert(`View details for ${booking.reservedBy}`)}
                              style={{
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => handleRemoveBooking(booking.busID, booking.seatNumber, booking.studentName)}
                              style={{
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: '#ecf0f1', 
              borderRadius: '8px',
              color: '#7f8c8d'
            }}>
              <h3>📭 {searchTerm || filterBus !== 'all' || filterStatus !== 'all' || filterType !== 'all' ? 'No Matching Bookings Found' : 'No Seat Bookings'}</h3>
              <p>
                {searchTerm || filterBus !== 'all' || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'There are currently no seat reservations in the system.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* PENDING RENEWALS VIEW */}
      {viewMode === 'pending' && pendingData && (
        <>
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
        </>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => {
            fetchPendingSeats();
            fetchAllBookings();
          }}
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