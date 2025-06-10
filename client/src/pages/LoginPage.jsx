import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5050/auth/login', { email, password });

      const { token, user: loggedInUser } = res.data;
      const decoded = JSON.parse(atob(token.split('.')[1])); // decode JWT payload

      setAuth({
        token,
        role: decoded.role,
        userId: decoded.userId,
        email: loggedInUser.email,
        refId: loggedInUser.refId
      });

      if (decoded.role === 'ngo') navigate('/ngo-dashboard');
      else if (decoded.role === 'volunteer') navigate('/volunteer-dashboard');
      else if (decoded.role === 'admin') navigate('/admin-dashboard');
      else setError('Unknown role');

    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
    setForgotPasswordMessage('');
    setForgotPasswordError('');
    setForgotPasswordEmail('');
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    setIsSubmittingForgotPassword(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const res = await axios.post('http://localhost:5050/auth/forgot-password', { 
        userEmail: forgotPasswordEmail.trim() 
      });

      setForgotPasswordMessage(res.data.message);
      setForgotPasswordEmail(''); // Clear the input on success
    } catch (err) {
      setForgotPasswordError(err.response?.data?.error || 'Failed to process password reset request');
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  const handleCancelForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordMessage('');
    setForgotPasswordError('');
    setForgotPasswordEmail('');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        /><br />
        <button 
          type="submit" 
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Login
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      {/* Forgot Password Section */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        {!showForgotPassword ? (
          <button 
            type="button" 
            onClick={handleForgotPasswordClick}
            style={{ 
              backgroundColor: 'transparent',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Forgot Password?
          </button>
        ) : (
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            backgroundColor: '#f9f9f9',
            textAlign: 'left'
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Reset Password</h3>
            <form onSubmit={handleForgotPasswordSubmit}>
              <input
                type="email"
                placeholder="Enter your registered email address"
                value={forgotPasswordEmail}
                onChange={e => setForgotPasswordEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginBottom: '10px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit"
                  disabled={isSubmittingForgotPassword}
                  style={{ 
                    flex: 1,
                    padding: '10px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: isSubmittingForgotPassword ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingForgotPassword ? 'Sending...' : 'Request Password Reset'}
                </button>
                <button 
                  type="button"
                  onClick={handleCancelForgotPassword}
                  style={{ 
                    flex: 1,
                    padding: '10px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
            {forgotPasswordError && (
              <p style={{ color: 'red', marginTop: '10px', marginBottom: '0' }}>
                {forgotPasswordError}
              </p>
            )}
            {forgotPasswordMessage && (
              <p style={{ color: 'green', marginTop: '10px', marginBottom: '0' }}>
                {forgotPasswordMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
