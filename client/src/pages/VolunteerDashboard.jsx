import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function VolunteerDashboard() {
  const { auth } = useContext(AuthContext);
  const [ngos, setNgos] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [expandedNgoId, setExpandedNgoId] = useState(null);

  useEffect(() => {
    if (!auth?.token) {
        setError('Authentication token not found for fetching NGOs.');
        setLoading(false);
        return;
    }

    setLoading(true);
    setError('');
    axios.get('http://localhost:5050/ngos', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    .then(res => {
      const completeNgos = res.data.filter(ngo => 
        ngo.organizationName && 
        ngo.areasOfConcern && 
        ngo.areasOfConcern.length > 0
      );
      setNgos(completeNgos);
      setFilteredNgos(completeNgos);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching NGOs:', err);
      setError('Failed to load organizations. ' + (err.response?.data?.error || err.message));
      setLoading(false);
    });
  }, [auth?.token]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredNgos(ngos);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = ngos.filter(ngo => 
      ngo.areasOfConcern.some(concern => 
        concern.toLowerCase().includes(lowerSearchTerm)
      )
    );
    setFilteredNgos(filtered);
  }, [searchTerm, ngos]);

  const handleToggleDetails = (ngoId) => {
    setExpandedNgoId(expandedNgoId === ngoId ? null : ngoId);
  };

  const handleContactNgo = (ngo) => {
    console.log(`Attempting to navigate to message center for NGO: ${ngo.organizationName} (ID: ${ngo._id})`);
    navigate(`/messages/new/${ngo._id}`, { state: { recipientName: ngo.organizationName, recipientRole: 'ngo' } });
  };

  return (
    <div className="admin-dashboard-container">
      <header>
        <h1>Welcome to your Volunteer Dashboard!</h1>
      </header>

      <div className="dashboard-content">
        <div className="user-list-section">
          <h2>Organizations in need:</h2>
          <div>
            <label htmlFor="filterConcern">Filter by Areas of Concern: </label>
            <input
              type="text"
              id="filterConcern"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., environment, education"
              style={{ marginBottom: '15px', padding: '8px', width: 'calc(100% - 22px)' }}
            />
          </div>

          {loading && <p>Loading organizations...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && filteredNgos.length === 0 && <p>No organizations found matching your criteria.</p>}
          
          {!loading && !error && filteredNgos.length > 0 && (
            <ul>
              {filteredNgos.map(ngo => (
                <li key={ngo._id} className="user-item">
                  <div className="user-item-header" onClick={() => handleToggleDetails(ngo._id)}>
                    <span>{ngo.organizationName}</span>
                    <span>{expandedNgoId === ngo._id ? '▼' : '▶'}</span>
                  </div>
                  {expandedNgoId === ngo._id && (
                    <div className="user-details">
                      <p><strong>Areas of Concern:</strong> {(Array.isArray(ngo.areasOfConcern) ? ngo.areasOfConcern.join(', ') : ngo.areasOfConcern) || 'N/A'}</p>
                      <button 
                        onClick={() => handleContactNgo(ngo)} 
                        style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}
                      >
                        Contact {ngo.organizationName}
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

export default VolunteerDashboard;
