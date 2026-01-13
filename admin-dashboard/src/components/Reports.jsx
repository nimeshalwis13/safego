import React, { useState } from "react";

const Reports = () => {
  const [loading, setLoading] = useState(false);

  // Generate PDF with download feature on preview page
  const generatePDFWithDownload = async (reportType, title) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportType}`);
      const data = await response.json();
      
      if (data.success) {
        // Create a new window with the report and download options
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        const htmlContent = generatePDFPreviewContent(reportType, title, data);
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Focus the new window
        printWindow.focus();
      }
    } catch (error) {
      alert('Error generating report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF preview content with download buttons
  const generatePDFPreviewContent = (reportType, title, data) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              line-height: 1.4;
              color: #333;
            }
            
            /* Download Controls - Hidden when printing */
            .download-controls {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #2c3e50;
              color: white;
              padding: 15px;
              z-index: 1000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .download-controls h3 {
              margin: 0;
              font-size: 18px;
            }
            
            .download-buttons {
              display: flex;
              gap: 10px;
            }
            
            .download-btn {
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              font-size: 14px;
              transition: all 0.3s;
            }
            
            .download-btn.primary {
              background: #27ae60;
              color: white;
            }
            
            .download-btn.primary:hover {
              background: #219a52;
            }
            
            .download-btn.secondary {
              background: #3498db;
              color: white;
            }
            
            .download-btn.secondary:hover {
              background: #2980b9;
            }
            
            .download-btn.danger {
              background: #e74c3c;
              color: white;
            }
            
            .download-btn.danger:hover {
              background: #c0392b;
            }
            
            /* Report Content */
            .report-content {
              margin-top: 80px;
              max-width: 800px;
              margin-left: auto;
              margin-right: auto;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #4CAF50;
              padding-bottom: 20px;
            }
            
            .header h1 {
              color: #4CAF50;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            
            .header p {
              margin: 5px 0;
              color: #666;
            }
            
            .summary { 
              background: #f9f9f9; 
              padding: 20px; 
              margin: 20px 0; 
              border-radius: 8px;
              border-left: 5px solid #4CAF50;
            }
            
            .summary h3 {
              margin-top: 0;
              color: #4CAF50;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 14px;
            }
            
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left; 
            }
            
            th { 
              background-color: #4CAF50; 
              color: white;
              font-weight: bold;
            }
            
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            
            h3 {
              color: #333;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 5px;
            }
            
            /* Print Styles */
            @media print {
              .download-controls {
                display: none !important;
              }
              
              .report-content {
                margin-top: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              @page {
                size: A4;
                margin: 1in;
              }
            }
          </style>
          
          <script>
            function downloadPDF() {
              window.print();
            }
            
            function saveAsDoc() {
              const content = document.querySelector('.report-content').innerHTML;
              const blob = new Blob([
                '<html><head><title>${title}</title></head><body>' + content + '</body></html>'
              ], {type: 'application/msword'});
              
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = '${title.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc';
              link.click();
            }
            
            function copyToClipboard() {
              const content = document.querySelector('.report-content').innerText;
              navigator.clipboard.writeText(content).then(function() {
                alert('Report content copied to clipboard!');
              }).catch(function() {
                alert('Failed to copy content. Please select and copy manually.');
              });
            }
          </script>
        </head>
        <body>
          <!-- Download Controls -->
          <div class="download-controls">
            <h3>📊 ${title}</h3>
            <div class="download-buttons">
              <button class="download-btn primary" onclick="downloadPDF()">
                📥 Download PDF
              </button>
              <button class="download-btn secondary" onclick="saveAsDoc()">
                📄 Save as Word
              </button>
              <button class="download-btn secondary" onclick="copyToClipboard()">
                📋 Copy Content
              </button>
              <button class="download-btn danger" onclick="window.close()">
                ❌ Close
              </button>
            </div>
          </div>
          
          <!-- Report Content -->
          <div class="report-content">
            <div class="header">
              <h1>🚌 SafeGo - ${title}</h1>
              <p><strong>Generated on:</strong> ${currentDate} at ${currentTime}</p>
              <p><strong>Report Type:</strong> ${title}</p>
            </div>
            
            ${generateReportContent(reportType, data)}
            
            <div class="footer">
              <p>This report was generated automatically by SafeGo Admin Dashboard</p>
              <p>© 2025 SafeGo - School Bus Management System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateReportContent = (reportType, data) => {
    switch (reportType) {
      case 'seat-usage':
        return `
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Buses: ${data.data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bus ID</th>
                <th>Bus Number</th>
                <th>Driver</th>
                <th>Total Seats</th>
                <th>Booked</th>
                <th>Pending</th>
                <th>Available</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(bus => `
                <tr>
                  <td>${bus.busID}</td>
                  <td>${bus.busNumber}</td>
                  <td>${bus.driverName}</td>
                  <td>${bus.totalSeats}</td>
                  <td>${bus.bookedSeats}</td>
                  <td>${bus.pendingSeats}</td>
                  <td>${bus.availableSeats}</td>
                  <td>${bus.utilizationRate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case 'reservation-summary':
        return `
          <div class="summary">
            <h3>Summary</h3>
            <p>Total Reservations: ${data.summary.totalReservations}</p>
            <p>Regular Students: ${data.summary.regularStudents}</p>
            <p>Temporary Students: ${data.summary.temporaryStudents}</p>
            <p>Booked: ${data.summary.bookedReservations}</p>
            <p>Pending: ${data.summary.pendingReservations}</p>
            <p>Cancelled: ${data.summary.cancelledReservations}</p>
          </div>
          <h3>Recent Reservations</h3>
          <table>
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Student ID</th>
                <th>Bus ID</th>
                <th>Seat</th>
                <th>Type</th>
                <th>Status</th>
                <th>Days Booked</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.recentReservations.map(res => `
                <tr>
                  <td>${res.reservationID}</td>
                  <td>${res.studentID}</td>
                  <td>${res.busID}</td>
                  <td>${res.seatNumber}</td>
                  <td>${res.type}</td>
                  <td>${res.status}</td>
                  <td style="color: ${res.type === 'Temporary' ? '#f57c00' : '#1976d2'}; font-weight: bold;">
                    ${res.daysBooked} ${res.type === 'Temporary' ? 'days' : (parseInt(res.daysBooked) === 180 ? 'days (6-month plan)' : 'days (monthly plan)')}
                  </td>
                  <td>${res.amount}</td>
                  <td>${res.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case 'revenue':
        return `
          <div class="summary">
            <h3>Revenue Summary</h3>
            <p>Total Revenue: ${data.summary.totalRevenue}</p>
            <p>Regular Students Revenue: ${data.summary.regularRevenue}</p>
            <p>Temporary Students Revenue: ${data.summary.temporaryRevenue}</p>
            <p>Total Transactions: ${data.summary.totalTransactions}</p>
          </div>
          <h3>Revenue by Bus</h3>
          <table>
            <thead>
              <tr>
                <th>Bus ID</th>
                <th>Revenue (LKR)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.revenueByBus).map(([busID, revenue]) => `
                <tr>
                  <td>${busID}</td>
                  <td>LKR ${revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      case 'waitlist':
        return `
          <div class="summary">
            <h3>Waitlist Summary</h3>
            <p>Total Waitlist Entries: ${data.summary.totalWaitlist}</p>
            <p>Waiting: ${data.summary.waitingEntries}</p>
            <p>Notified: ${data.summary.notifiedEntries}</p>
            <p>Cancelled: ${data.summary.cancelledEntries}</p>
            <p>Expired: ${data.summary.expiredEntries}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Waitlist ID</th>
                <th>Student ID</th>
                <th>Bus ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Days Requested</th>
                <th>Request Date</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.waitlistEntries.map(entry => `
                <tr>
                  <td>${entry.waitlistID}</td>
                  <td>${entry.studentID}</td>
                  <td>${entry.busID}</td>
                  <td>${entry.type}</td>
                  <td>${entry.status}</td>
                  <td>${entry.daysRequested}</td>
                  <td>${entry.requestDate}</td>
                  <td>${entry.createdDate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

      default:
        return '<p>No data available</p>';
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "10px", 
        padding: "30px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
      }}>
        <h1 style={{ 
          color: "#333", 
          marginBottom: "30px", 
          textAlign: "center",
          borderBottom: "3px solid #4CAF50",
          paddingBottom: "15px"
        }}>
          📊 Reports Generation
        </h1>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "20px" 
        }}>
          
          {/* Seat Usage Report */}
          <div style={{ 
            border: "2px solid #e3f2fd", 
            borderRadius: "10px", 
            padding: "20px", 
            backgroundColor: "#fafafa" 
          }}>
            <h3 style={{ color: "#1976d2", marginBottom: "15px" }}>🚌 Seat Usage Report</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              View bus utilization, seat availability, and occupancy rates across all buses.
            </p>
            <button
              onClick={() => generatePDFWithDownload('seat-usage', 'Seat Usage Report')}
              disabled={loading}
              style={{
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%"
              }}
            >
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>

          {/* Reservation Summary Report */}
          <div style={{ 
            border: "2px solid #e8f5e8", 
            borderRadius: "10px", 
            padding: "20px", 
            backgroundColor: "#fafafa" 
          }}>
            <h3 style={{ color: "#388e3c", marginBottom: "15px" }}>📋 Reservation Summary</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Complete overview of all reservations including status and student types.
            </p>
            <button
              onClick={() => generatePDFWithDownload('reservation-summary', 'Reservation Summary Report')}
              disabled={loading}
              style={{
                backgroundColor: "#388e3c",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%"
              }}
            >
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>

          {/* Revenue Report */}
          <div style={{ 
            border: "2px solid #fff3e0", 
            borderRadius: "10px", 
            padding: "20px", 
            backgroundColor: "#fafafa" 
          }}>
            <h3 style={{ color: "#f57c00", marginBottom: "15px" }}>💰 Revenue Report</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Financial summary including total revenue, transactions, and income breakdown.
            </p>
            <button
              onClick={() => generatePDFWithDownload('revenue', 'Revenue Report')}
              disabled={loading}
              style={{
                backgroundColor: "#f57c00",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%"
              }}
            >
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>

          {/* Waitlist Report */}
          <div style={{ 
            border: "2px solid #f3e5f5", 
            borderRadius: "10px", 
            padding: "20px", 
            backgroundColor: "#fafafa" 
          }}>
            <h3 style={{ color: "#7b1fa2", marginBottom: "15px" }}>📝 Waitlist Report</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Monitor waitlist entries, status updates, and pending seat requests.
            </p>
            <button
              onClick={() => generatePDFWithDownload('waitlist', 'Waitlist Report')}
              disabled={loading}
              style={{
                backgroundColor: "#7b1fa2",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                width: "100%"
              }}
            >
              {loading ? "Generating..." : "📊 Generate Report"}
            </button>
          </div>

        </div>

        <div style={{ 
          marginTop: "30px", 
          padding: "20px", 
          backgroundColor: "#e3f2fd", 
          borderRadius: "8px", 
          textAlign: "center" 
        }}>
          <h4 style={{ color: "#1976d2", marginBottom: "10px" }}>📥 Report Features</h4>
          <p style={{ color: "#333", margin: "0 0 10px 0" }}>
            Click "Generate Report" to open a new window with multiple download options:
          </p>
          <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>
            📥 Download PDF • 📄 Save as Word • 📋 Copy Content • ❌ Close Window
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;