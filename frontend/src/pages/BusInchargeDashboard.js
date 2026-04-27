import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API_BASE_URL from '../apiConfig';
import './BusInchargeDashboard.css';

const BusInchargeDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [issueForm, setIssueForm] = useState({
    issueType: '',
    description: '',
    expectedDelayMinutes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const issueTypes = [
    { value: 'puncture', label: '🛞 Puncture' },
    { value: 'breakdown', label: '🔧 Engine Breakdown' },
    { value: 'accident', label: '💥 Accident' },
    { value: 'traffic', label: '🚦 Traffic Delay' },
    { value: 'fuel', label: '⛽ Fuel Issue' },
    { value: 'other', label: '❓ Other' }
  ];

  useEffect(() => {
    fetchAssignedBuses();
  }, []);

  const fetchAssignedBuses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please login first', 'error');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bus/incharge/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setBuses(data);
        } else {
          showToast('No buses assigned to you', 'warning');
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to fetch buses', 'error');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      showToast('Error fetching buses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBus || !issueForm.issueType) {
      showToast('Please select a bus and issue type', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bus/incharge/report-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          busId: selectedBus,
          issueType: issueForm.issueType,
          description: issueForm.description,
          expectedDelayMinutes: issueForm.expectedDelayMinutes || 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Issue reported! ${data.studentsNotified} students notified.`, 'success');
        setIssueForm({ issueType: '', description: '', expectedDelayMinutes: '' });
        fetchAssignedBuses();
      } else {
        showToast(data.message || 'Failed to report issue', 'error');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      showToast('Error reporting issue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveIssue = async (busId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bus/incharge/resolve-issue/${busId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Issue resolved and students notified', 'success');
        fetchAssignedBuses();
      } else {
        showToast('Failed to resolve issue', 'error');
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
      showToast('Error resolving issue', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bus-incharge-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bus-incharge-container">
      <div className="incharge-header">
        <h1>🚌 Bus Incharge Dashboard</h1>
        <p>Welcome, {user?.name}</p>
      </div>

      <div className="incharge-content">
        {/* Bus List Section */}
        <div className="buses-section">
          <h2>Your Assigned Buses</h2>
          {buses.length === 0 ? (
            <p className="no-buses">No buses assigned to you yet.</p>
          ) : (
            <div className="buses-grid">
              {buses.map(bus => (
                <div 
                  key={bus._id} 
                  className={`bus-card ${selectedBus === bus._id ? 'selected' : ''} ${bus.status ? 'has-issue' : ''}`}
                  onClick={() => setSelectedBus(bus._id)}
                >
                  <div className="bus-number">{bus.busNumber}</div>
                  <div className="bus-route">{bus.route}</div>
                  <div className="bus-time">⏰ {bus.startTime}</div>
                  {bus.status && (
                    <div className="bus-status-badge">
                      ⚠️ {bus.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Issue Section */}
        <div className="report-section">
          <h2>⚠️ Report Bus Issue</h2>
          <form onSubmit={handleIssueSubmit} className="issue-form">
            <div className="form-group">
              <label>Select Bus *</label>
              <select 
                value={selectedBus || ''}
                onChange={(e) => setSelectedBus(e.target.value)}
                required
              >
                <option value="">-- Select a Bus --</option>
                {buses.map(bus => (
                  <option key={bus._id} value={bus._id}>
                    {bus.busNumber} - {bus.route}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Issue Type *</label>
              <select 
                value={issueForm.issueType}
                onChange={(e) => setIssueForm({...issueForm, issueType: e.target.value})}
                required
              >
                <option value="">-- Select Issue Type --</option>
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Expected Delay (minutes)</label>
              <input 
                type="number"
                value={issueForm.expectedDelayMinutes}
                onChange={(e) => setIssueForm({...issueForm, expectedDelayMinutes: e.target.value})}
                placeholder="e.g., 30"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea 
                value={issueForm.description}
                onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                placeholder="Add any additional details..."
                rows="3"
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting || !selectedBus}
            >
              {submitting ? 'Reporting...' : '📢 Report Issue'}
            </button>
          </form>
        </div>

        {/* Active Issues Section */}
        <div className="issues-section">
          <h2>📋 Active Issues</h2>
          {buses.filter(b => b.status).length === 0 ? (
            <p className="no-issues">✅ No active issues</p>
          ) : (
            <div className="issues-list">
              {buses.filter(b => b.status).map(bus => (
                <div key={bus._id} className="issue-card">
                  <div className="issue-header">
                    <span className="issue-bus">{bus.busNumber}</span>
                    <span className="issue-type">{bus.status}</span>
                  </div>
                  <div className="issue-message">{bus.statusMessage || 'No additional details'}</div>
                  <button 
                    className="resolve-btn"
                    onClick={() => handleResolveIssue(bus._id)}
                  >
                    ✅ Mark Resolved
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

export default BusInchargeDashboard;