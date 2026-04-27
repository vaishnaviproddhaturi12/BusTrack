import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from '../apiConfig';
import './RoutePage.css';

const naturalCompare = (a = '', b = '') =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const RoutePage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/bus/routes`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Unable to load bus routes');
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid routes response');
        }

        const sortedRoutes = [...data].sort((a, b) => naturalCompare(a.name, b.name));
        setRoutes(sortedRoutes);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Routes load error:', err);
        setError('Unable to load bus routes right now. Please try again after the server starts.');
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

    const morningStart = 7 * 60 + 40;
    const morningEnd = 9 * 60;
    const eveningStart = 16 * 60;
    const stopCount = stops.length;
    const interval = stopCount > 1 ? Math.round((morningEnd - morningStart) / (stopCount - 1)) : 10;

    return stops.map((stop, index) => {
      const morningTime = formatTime(morningStart + index * interval);
      const eveningTime = formatTime(eveningStart + (stopCount - 1 - index) * interval);
      return { stop, morningTime, eveningTime };
    });
  };

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    if (normalizedQuery === '') {
      return routes;
    }

    return routes.filter((route) => {
      const matchesName = route.name.toLowerCase().includes(normalizedQuery);
      const matchesStop = route.stops?.some((stop) => stop.toLowerCase().includes(normalizedQuery));
      return matchesName || matchesStop;
    });
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

        {error && <div className="alert alert-warning text-center">{error}</div>}

        <div className="search-section mb-4">
          <div className="row">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search routes or stops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4 search-button-col">
              <button className="btn btn-primary search-button" onClick={() => setSearchTerm(searchTerm.trim())}>
                Search
              </button>
            </div>
          </div>
        </div>

        {filteredRoutes.length === 0 ? (
          <p className="text-center text-muted mt-4">
            {searchTerm.trim() ? 'No matching routes found.' : 'No bus routes available right now.'}
          </p>
        ) : (
          <div className="routes-grid">
            {filteredRoutes.map((route, index) => {
              const stopTimes = getStopTimes(route.stops);
              const busLabel = route.busNumber || `BUS ${String(index + 1).padStart(3, '0')}`;
              return (
                <div key={route.id} className="route-card">
                  <div className="route-header">
                    <div className="route-title-group">
                      <h3>{route.name}</h3>
                      <span className="route-bus-number">{busLabel}</span>
                    </div>
                    <div className="route-info">
                      <span className="route-distance">{route.distance}</span>
                      <span className="route-summary">
                        <span>Starts 7:40 AM · Ends 9:00 AM</span>
                        <span>Evening 4:00 PM</span>
                      </span>
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
        )}
      </div>
    </div>
  );
};

export default RoutePage;
