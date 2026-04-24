import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimings();
  }, []);

  const fetchTimings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bus/timings`);
      const data = await response.json();
      setTimings(data);
    } catch (error) {
      console.error('Error fetching timings:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTimings = () => {
    const timingsSection = document.getElementById('timings-section');
    if (timingsSection) {
      timingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">TrackMyBus</h1>
          <p className="hero-subtitle">
            Your reliable college bus tracking system. Stay updated with bus locations,
            routes, timings, and contact information.
          </p>
          <div className="hero-buttons">
            <Link to="/routes" className="btn btn-primary btn-lg hero-action-btn">
              View Routes
            </Link>
            <button onClick={scrollToTimings} className="btn btn-primary btn-lg hero-action-btn">
              Check Timings
            </button>
            {user && user.role === 'student' && user.bus && (
              <Link to="/track" className="btn btn-primary btn-lg hero-action-btn">
                Track My Bus
              </Link>
            )}
          </div>
        </div>
        <div className="hero-image">
          <img
            src="/logo.jpeg"
            alt="TrackMyBus logo"
            className="bus-image"
          />
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="row">
            <div className="col-md-3">
              <div className="feature-card">
                <div className="feature-icon">🗺️</div>
                <h3>Bus Routes</h3>
                <p>View detailed bus routes and stops across the campus.</p>
                <Link to="/routes" className="btn btn-outline-primary feature-action-btn">Explore Routes</Link>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card">
                <div className="feature-icon">⏰</div>
                <h3>Timings</h3>
                <p>Check bus departure and arrival times for your convenience.</p>
                <button onClick={scrollToTimings} className="btn btn-outline-primary feature-action-btn">View Timings</button>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card">
                <div className="feature-icon">📍</div>
                <h3>Live Tracking</h3>
                <p>Track your assigned bus location in real-time.</p>
                {user && user.role === 'student' && user.bus ? (
                  <Link to="/track" className="btn btn-outline-primary feature-action-btn">Track My Bus</Link>
                ) : (
                  <span className="text-muted small">Login as student to access</span>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card">
                <div className="feature-icon">📞</div>
                <h3>Contacts</h3>
                <p>Get in touch with drivers and bus incharges when needed.</p>
                <Link to="/contacts" className="btn btn-outline-primary feature-action-btn">View Contacts</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="timings-section" className="timings-section">
        <div className="container">
          <h2 className="section-title">Bus Timings</h2>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              {timings.map((bus) => (
                <div key={bus.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="timing-card">
                    <h4>{bus.route}</h4>
                    <div className="schedule">
                      {bus.schedule && bus.schedule.length > 0 ? (
                        bus.schedule.map((time, index) => (
                          <div key={index} className="time-slot">
                            <span className="time">{time.time}</span>
                            <span className="direction">{time.direction}</span>
                          </div>
                        ))
                      ) : (
                        <p>No schedule available</p>
                      )}
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

export default Home;
