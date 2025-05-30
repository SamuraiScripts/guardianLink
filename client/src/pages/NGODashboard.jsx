import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function NGODashboard() {
  const { auth } = useContext(AuthContext);
  const [volunteers, setVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [expertiseSearchTerm, setExpertiseSearchTerm] = useState('');
  const [minHoursFilter, setMinHoursFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [expandedVolunteerId, setExpandedVolunteerId] = useState(null);

  useEffect(() => {
    if (!auth?.token) {
      setError('Authentication token not found for fetching volunteers.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    axios.get('http://localhost:5050/volunteers', { 
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    .then(res => {
      const completeVolunteers = res.data.filter(volunteer => 
        volunteer.fullName && 
        volunteer.weeklyAvailability !== undefined && volunteer.weeklyAvailability !== null &&
        volunteer.areasOfExpertise && volunteer.areasOfExpertise.length > 0 &&
        volunteer.resumeUrl
      );
      setVolunteers(completeVolunteers);
      setFilteredVolunteers(completeVolunteers);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching volunteers:', err);
      setError('Failed to load available volunteers. ' + (err.response?.data?.error || err.message));
      setLoading(false);
    });
  }, [auth?.token]);

  useEffect(() => {
    let Wfiltered = volunteers;
    if (expertiseSearchTerm) {
      const lowerSearchTerm = expertiseSearchTerm.toLowerCase();
      Wfiltered = Wfiltered.filter(volunteer => 
        volunteer.areasOfExpertise.some(expertise => 
          expertise.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
    if (minHoursFilter && !isNaN(parseInt(minHoursFilter))) {
      const hours = parseInt(minHoursFilter);
      Wfiltered = Wfiltered.filter(volunteer => 
        volunteer.weeklyAvailability >= hours
      );
    }
    setFilteredVolunteers(Wfiltered);
  }, [expertiseSearchTerm, minHoursFilter, volunteers]);

  const handleToggleDetails = (volunteerId) => {
    setExpandedVolunteerId(expandedVolunteerId === volunteerId ? null : volunteerId);
  };

  const handleContactVolunteer = (volunteer) => {
    console.log(`Attempting to navigate to message center for Volunteer: ${volunteer.fullName} (ID: ${volunteer._id})`);
    navigate(`/messages/new/${volunteer._id}`, { state: { recipientName: volunteer.fullName, recipientRole: 'volunteer' } });
  };

  return (
    <div className="admin-dashboard-container">
      <header>
        <h1>Welcome to your Organization's Dashboard!</h1>
      </header>

      <div className="dashboard-content">
        <div className="user-list-section">
          <h2>Available Volunteers:</h2>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="filterExpertise" style={{ marginRight: '10px' }}>Filter by Areas of Expertise: </label>
              <input
                type="text"
                id="filterExpertise"
                value={expertiseSearchTerm}
                onChange={(e) => setExpertiseSearchTerm(e.target.value)}
                placeholder="e.g., web development, teaching"
                style={{ padding: '8px', width: 'calc(100% - 220px)' }}
              />
            </div>
            <div>
              <label htmlFor="filterHours" style={{ marginRight: '10px' }}>Min. Hours Available/Week: </label>
              <input
                type="number"
                id="filterHours"
                value={minHoursFilter}
                onChange={(e) => setMinHoursFilter(e.target.value)}
                placeholder="e.g., 5"
                style={{ padding: '8px', width: 'calc(100% - 220px)' }}
              />
            </div>
          </div>

          {loading && <p>Loading volunteers...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && filteredVolunteers.length === 0 && <p>No volunteers found matching your criteria.</p>}
          
          {!loading && !error && filteredVolunteers.length > 0 && (
            <ul>
              {filteredVolunteers.map(volunteer => (
                <li key={volunteer._id} className="user-item">
                  <div className="user-item-header" onClick={() => handleToggleDetails(volunteer._id)}>
                    <span>{volunteer.fullName}</span>
                    <span>{expandedVolunteerId === volunteer._id ? '▼' : '▶'}</span>
                  </div>
                  {expandedVolunteerId === volunteer._id && (
                    <div className="user-details">
                      <p><strong>Full Name:</strong> {volunteer.fullName}</p>
                      <p><strong>Weekly Availability (hrs):</strong> {volunteer.weeklyAvailability}</p>
                      <p><strong>Areas of Expertise:</strong> {(Array.isArray(volunteer.areasOfExpertise) ? volunteer.areasOfExpertise.join(', ') : volunteer.areasOfExpertise) || 'N/A'}</p>
                      {volunteer.resumeUrl ? (
                        <p><strong>Resume:</strong> <a href={`http://localhost:5050${volunteer.resumeUrl}`} target="_blank" rel="noopener noreferrer">View Resume</a></p>
                      ) : <p><strong>Resume:</strong> N/A</p>}
                      <button 
                        onClick={() => handleContactVolunteer(volunteer)} 
                        style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}
                      >
                        Contact {volunteer.fullName}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;
