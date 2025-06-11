import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function RegisterNgoPage() {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [areasOfConcern, setAreasOfConcern] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5050/ngos', {
        organizationName,
        email,
        password,
        areasOfConcern: areasOfConcern.split(',').map(tag => tag.trim())
      });

      const { token } = res.data;
      const decoded = JSON.parse(atob(token.split('.')[1]));

      setAuth({
        token,
        role: decoded.role,
        userId: decoded.userId,
        email: email
      });

      navigate('/ngo-dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card ngo-form">
        <div className="register-header">
          <div className="back-button" onClick={() => navigate('/register-type')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Account Type
          </div>
          <h1>NGO Registration</h1>
          <p>Register your organization to get the help you need</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input
                type="text"
                id="organizationName"
                placeholder="Enter your organization's name"
                value={organizationName}
                onChange={e => setOrganizationName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your organization's email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Create a secure password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="areasOfConcern">Areas of Concern</label>
              <input
                type="text"
                id="areasOfConcern"
                placeholder="e.g., SQL injection, Phishing attempts, etc. (comma-separated)"
                value={areasOfConcern}
                onChange={e => setAreasOfConcern(e.target.value)}
              />
              <small className="form-help">Separate multiple areas with commas</small>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Creating Account...
              </>
            ) : (
              'Create NGO Account'
            )}
          </button>

          <div className="form-footer">
            <p>Already have an account? <span className="link" onClick={() => navigate('/login')}>Sign in here</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterNgoPage;
