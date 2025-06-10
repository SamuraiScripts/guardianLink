import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function NavBar() {
  const { auth, setAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count when user is logged in
  useEffect(() => {
    if (auth?.token) {
      loadUnreadCount();
      // Set up polling every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [auth?.token]);

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get('http://localhost:5050/messages/unread-count', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleLogout = () => {
    setAuth({ token: null, role: null, userId: null });
    navigate('/');
  };

  // Show non-authenticated navbar on login/register pages OR when user is not logged in
  const authRoutes = [
    '/login',
    '/register-type',
    '/register-volunteer',
    '/register-ngo'
  ];

  const shouldShowNonAuthNavbar = authRoutes.includes(location.pathname) || !auth || !auth.token;

  if (shouldShowNonAuthNavbar) {
    return (
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
        <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/register-type" style={{ marginRight: '1rem' }}>Register</Link>
      </nav>
    );
  }

  // Logged-in NavBar for all roles
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to={`/${auth.role}-dashboard`} style={{ marginRight: '1rem' }}>Dashboard</Link>
      <Link to="/profile" style={{ marginRight: '1rem' }}>Profile</Link>
      <Link to="/messages" style={{ marginRight: '1rem', position: 'relative' }}>
        Messages
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default NavBar;
