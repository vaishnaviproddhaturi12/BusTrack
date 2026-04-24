import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';
import './Contacts.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch contacts from backend
    fetch(`${API_BASE_URL}/api/bus/contacts`)
      .then(res => res.json())
      .then(data => {
        setContacts(data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

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

        <div className="contacts-grid">
          {contacts.map(contact => (
            <div key={contact.id} className="contact-card">
              <div className="contact-header">
                <h3>{contact.busNumber}</h3>
              </div>
              <div className="contact-details">
                <div className="contact-person">
                  <div className="person-icon">👨‍🚗</div>
                  <div className="person-info">
                    <h4>Driver</h4>
                    <p className="person-name">{contact.driver.name}</p>
                    <a href={`tel:${contact.driver.phone}`} className="phone-link">
                      📞 {contact.driver.phone}
                    </a>
                  </div>
                </div>
                <div className="contact-person">
                  <div className="person-icon">👩‍💼</div>
                  <div className="person-info">
                    <h4>Bus Incharge</h4>
                    <p className="person-name">{contact.incharge.name}</p>
                    <a href={`tel:${contact.incharge.phone}`} className="phone-link">
                      📞 {contact.incharge.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contacts;