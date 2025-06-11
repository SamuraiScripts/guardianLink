import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Register.css';

export default function RegisterVolunteerPage() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    weeklyAvailability: '',
    backgroundCheck: false,
    areasOfExpertise: '',
    resume: null
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, resume: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const data = new FormData();
    data.append('fullName', formData.fullName);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('weeklyAvailability', formData.weeklyAvailability);
    data.append('backgroundCheck', formData.backgroundCheck);
    data.append('areasOfExpertise', formData.areasOfExpertise);
    data.append('resume', formData.resume);

    try {
      const res = await axios.post('http://localhost:5050/volunteers', data);
      const { token } = res.data;
      if (token) {
        const decodedPayload = JSON.parse(atob(token.split('.')[1]));
        setAuth({
          token,
          role: decodedPayload.role,
          userId: decodedPayload.userId,
          email: decodedPayload.email,
          refId: decodedPayload.refId
        });
        navigate('/volunteer-dashboard');
      } else {
        setError('Registration succeeded, but failed to log in automatically. Please try logging in.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card volunteer-form">
        <div className="register-header">
          <div className="back-button" onClick={() => navigate('/register-type')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Account Type
          </div>
          <h1>Volunteer Registration</h1>
          <p>Join our community of passionate volunteers making a difference</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" encType="multipart/form-data">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
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
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weeklyAvailability">Weekly Availability (Hours)</label>
              <input
                type="number"
                id="weeklyAvailability"
                name="weeklyAvailability"
                placeholder="How many hours per week can you volunteer?"
                value={formData.weeklyAvailability}
                onChange={handleChange}
                min="1"
                max="40"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="areasOfExpertise">Areas of Expertise</label>
              <input
                type="text"
                id="areasOfExpertise"
                name="areasOfExpertise"
                placeholder="e.g., XSS attacks, SQL injection, etc. (comma-separated)"
                value={formData.areasOfExpertise}
                onChange={handleChange}
                required
              />
              <small className="form-help">Separate multiple areas with commas</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group file-upload-group">
              <label htmlFor="resume">Upload Resume</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleChange}
                  required
                />
                <div className="file-upload-display">
                  {formData.resume ? (
                    <span className="file-selected">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C4.89 2 4.01 2.89 4.01 4L4 20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#646cff"/>
                      </svg>
                      {formData.resume.name}
                    </span>
                  ) : (
                    <span className="file-placeholder">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C4.89 2 4.01 2.89 4.01 4L4 20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#9ca3af"/>
                      </svg>
                      Choose file (PDF, DOC, DOCX)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="backgroundCheck"
                  checked={formData.backgroundCheck}
                  onChange={handleChange}
                />
                I confirm I have passed a criminal background check
              </label>
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
              'Create Volunteer Account'
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
