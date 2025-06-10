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
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register-type" className="nav-link">Register</Link>
        </div>
      </nav>
    );
  }

  // Logged-in NavBar for all roles
  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to={`/${auth.role}-dashboard`} className="nav-link">Dashboard</Link>
        <Link to="/profile" className="nav-link">Profile</Link>
        <Link to="/messages" className="nav-link messages-link">
          Messages
          {unreadCount > 0 && (
            <span className="unread-notification">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </nav>
  );
}

export default NavBar;
