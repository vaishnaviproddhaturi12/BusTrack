import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import './AdminQR.css';

const AdminQR = () => {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const response = await fetch('https://bustrack-backend-dod9.onrender.com/api/bus/all');
      const data = await response.json();
      setBuses(data);
      
      // Generate QR codes for all buses
      const qrData = {};
      for (const bus of data) {
        const qrString = JSON.stringify({
          busId: bus._id,
          busNumber: bus.busNumber,
          route: bus.route
        });
        const qrImage = await QRCode.toDataURL(qrString, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        qrData[bus._id] = qrImage;
      }
      setQrCodes(qrData);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const printAllQRCodes = () => {
    const printWindow = window.open('', '_blank');
    const qrPrintContent = buses.map(bus => `
      <div style="page-break-inside: avoid; text-align: center; margin: 20px; padding: 20px; border: 2px solid #333; display: inline-block;">
        <h3 style="margin: 10px 0;">${bus.busNumber}</h3>
        <p style="margin: 5px 0; color: #666;">${bus.route}</p>
        <img src="${qrCodes[bus._id]}" style="width: 150px; height: 150px;" />
        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">Scan to mark attendance</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bus QR Codes - Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .print-container { display: flex; flex-wrap: wrap; justify-content: center; }
          </style>
        </head>
        <body>
          <h1>🚌 Bus QR Codes for Attendance</h1>
          <p style="text-align: center; color: #666;">Print and paste these QR codes inside each bus</p>
          <div class="print-container">
            ${qrPrintContent}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container my-5">
        <h2>Admin Access Required</h2>
        <p className="text-muted">Please log in as admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-qr-page py-5">
      <div className="container">
        <div className="admin-qr-container">
        <h2>🚌 Bus QR Code Generator</h2>
        <p className="text-muted">Generate and print QR codes for all buses. Paste these inside each bus for student attendance scanning.</p>
        
        <button className="btn btn-primary btn-lg mb-4" onClick={printAllQRCodes}>
          🖨️ Print All QR Codes
        </button>

        {loading ? (
          <p>Loading buses...</p>
        ) : (
          <div className="qr-grid">
            {buses.map(bus => (
              <div key={bus._id} className="qr-card">
                <div className="qr-card-header">
                  <h4>{bus.busNumber}</h4>
                  <span className="badge bg-secondary">{bus.route}</span>
                </div>
                <div className="qr-image">
                  {qrCodes[bus._id] && (
                    <img src={qrCodes[bus._id]} alt={`QR for ${bus.busNumber}`} />
                  )}
                </div>
                <div className="qr-info">
                  <small>Bus ID: {bus._id}</small>
                </div>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head><title>${bus.busNumber} QR Code</title></head>
                        <body style="text-align: center; padding: 50px;">
                          <h2>${bus.busNumber}</h2>
                          <p>${bus.route}</p>
                          <img src="${qrCodes[bus._id]}" style="width: 200px; height: 200px;" />
                          <p style="margin-top: 20px;">Scan to mark attendance</p>
                          <script>window.onload = function() { window.print(); }</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  🖨️ Print
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminQR;
