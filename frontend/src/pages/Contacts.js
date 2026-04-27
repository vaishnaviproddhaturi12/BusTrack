import React, { useState, useEffect, useMemo } from 'react';
import API_BASE_URL from '../apiConfig';
import './Contacts.css';

const naturalCompare = (a = '', b = '') =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/bus/contacts`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Unable to load bus contacts');
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid contacts response');
        }

        const sortedContacts = [...data].sort((a, b) =>
          naturalCompare(a.busNumber, b.busNumber)
        );
        setContacts(sortedContacts);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Contacts load error:', err);
        setError('Unable to load bus contacts right now. Please try again after the server starts.');
        setLoading(false);
      });
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return contacts;
    }

    return contacts.filter((contact) =>
      [
        contact.busNumber,
        contact.driver?.name,
        contact.driver?.phone,
        contact.incharge?.name,
        contact.incharge?.phone
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [searchTerm, contacts]);

  if (loading) {
    return (
      <div className="contacts-container">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading bus contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contacts-container">
      <div className="container">
        <h1 className="page-title">Bus Contacts</h1>
        <p className="page-subtitle">Contact information for drivers and bus incharges</p>

        {error && <div className="alert alert-warning text-center">{error}</div>}

        <div className="search-section mb-4">
          <div className="row">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by bus number, driver, incharge, or phone..."
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

        <div className="contacts-grid">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-header">
                <h3>{contact.busNumber}</h3>
              </div>
              <div className="contact-details">
                <div className="contact-person">
                  <div className="person-icon">{'\u{1F468}\u200D\u{1F68C}'}</div>
                  <div className="person-info">
                    <h4>Driver</h4>
                    <p className="person-name">{contact.driver?.name || 'N/A'}</p>
                    <a href={`tel:${contact.driver?.phone || ''}`} className="phone-link">
                      {contact.driver?.phone || 'N/A'}
                    </a>
                  </div>
                </div>
                <div className="contact-person">
                  <div className="person-icon">{'\u{1F468}\u200D\u{1F3EB}'}</div>
                  <div className="person-info">
                    <h4>Bus Incharge</h4>
                    <p className="person-name">{contact.incharge?.name || 'N/A'}</p>
                    <a href={`tel:${contact.incharge?.phone || ''}`} className="phone-link">
                      {contact.incharge?.phone || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!filteredContacts.length && (
          <p className="text-center text-muted mt-4">
            {searchTerm.trim() ? 'No matching contacts found.' : 'No bus contacts available right now.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Contacts;
