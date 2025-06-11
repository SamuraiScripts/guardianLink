import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // Import CSS for button styling

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
    // Only fetch data if profile is complete (refId exists)
    if (auth?.refId && auth?.token) {
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
    } else if (!auth?.token) {
      setError('Authentication token not found.');
      setLoading(false);
    } else {
      // If no refId but token exists, it means profile is incomplete, no need to fetch dashboard data.
      setLoading(false); 
    }
  }, [auth]); // Rerun if auth object changes (e.g. refId populated after profile completion)

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

  // Conditional rendering based on auth.refId
  if (auth && (auth.role === 'ngo' || auth.role === 'volunteer') && !auth.refId) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="main-content">
            <header>
              <h1>Welcome, {auth.email}!</h1>
            </header>
            <div style={{ border: '1px solid #ffcc00', backgroundColor: '#fff9e6', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
              <h2>Please complete your profile</h2>
              <p>To access your dashboard and all features, you need to complete your organization's profile.</p>
              <button 
                onClick={() => navigate('/profile')} 
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
              >
                Go to Profile Page
              </button>
            </div>
          </div>
          <div className="sidebar-space">
            {/* Future space for images */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="main-content">
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
                    placeholder="e.g. SQL injection, cloud security, etc."
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
                    placeholder="e.g. 5"
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
                            className="contact-button"
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
        
        <div className="sidebar-space">
          <img 
            src="/images/ngodashboard.avif" 
            alt="NGO team collaboration" 
            style={{
              width: '100%',
              height: '50%',
              maxWidth: '500px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
          <p style={{ 
            marginTop: '20px', 
            textAlign: 'center', 
            color: '#6c757d',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            Find expert volunteers to strengthen your cybersecurity posture
          </p>
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;
