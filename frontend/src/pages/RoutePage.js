import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';
import './RoutePage.css';

const RoutePage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/bus/routes`)
      .then(res => res.json())
      .then(data => {
        setRoutes(data);
        setFilteredRoutes(data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const formatTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour < 12 ? 'AM' : 'PM';
    const displayHour = ((hour + 11) % 12) + 1;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
  };

  const getStopTimes = (stops) => {
    if (!stops || stops.length === 0) return [];

    const morningStart = 7 * 60 + 40; // 7:40 AM
    const morningEnd = 9 * 60; // 9:00 AM
    const eveningStart = 16 * 60; // 4:00 PM
    const stopCount = stops.length;
    const interval = stopCount > 1 ? Math.round((morningEnd - morningStart) / (stopCount - 1)) : 10;

    return stops.map((stop, index) => {
      const morningTime = formatTime(morningStart + index * interval);
      const eveningTime = formatTime(eveningStart + (stopCount - 1 - index) * interval);
      return { stop, morningTime, eveningTime };
    });
  };

  const handleSearch = (query = searchTerm) => {
    const searchQuery = typeof query === 'string' ? query : searchTerm;
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (normalizedQuery === '') {
      setFilteredRoutes(routes);
      return;
    }

    const filtered = routes.filter(route => {
      const matchesName = route.name.toLowerCase().includes(normalizedQuery);
      const matchesStop = route.stops?.some(stop => stop.toLowerCase().includes(normalizedQuery));
      return matchesName || matchesStop;
    });

    setFilteredRoutes(filtered);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, routes]);

  if (loading) {
    return (
      <div className="routes-container">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading bus routes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="routes-container">
      <div className="container">
        <h1 className="page-title">Bus Routes</h1>
        <p className="page-subtitle">Explore all available bus routes and their timings</p>

        {/* Search Section */}
        <div className="search-section mb-4">
          <div className="row">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search routes or stops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" onClick={() => handleSearch()}>
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="routes-grid">
          {filteredRoutes.map(route => {
            const stopTimes = getStopTimes(route.stops);
            return (
              <div key={route.id} className="route-card">
                <div className="route-header">
                  <h3>{route.name}</h3>
                  <div className="route-info">
                    <span className="route-distance">{route.distance}</span>
                    <span className="route-summary">Starts 7:40 AM · Ends 9:00 AM · Evening 4:00 PM</span>
                  </div>
                </div>

                <div className="route-details">
                  <div className="route-times-section">
                    <h4>Stop Times</h4>
                    <div className="route-times-list">
                      <div className="route-time-entry header-row">
                        <span className="route-time-label">Stop</span>
                        <span className="route-time-label">Morning</span>
                        <span className="route-time-label">Evening</span>
                      </div>
                      {stopTimes.map((entry, index) => (
                        <div key={index} className="route-time-entry">
                          <span>{entry.stop}</span>
                          <span>{entry.morningTime}</span>
                          <span>{entry.eveningTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoutePage;