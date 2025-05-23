import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function NavBar() {
  const { auth, setAuth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const hideOnRoutes = [
    '/login',
    '/register-type',
    '/register-volunteer',
    '/register-ngo'
  ];

  // Hide NavBar on certain pages
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    setAuth({ token: null, role: null, userId: null });
    navigate('/');
  };

  // Null-safe check before accessing auth.token
  if (!auth || !auth.token) {
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
      <Link to="/messages" style={{ marginRight: '1rem' }}>Messages</Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default NavBar;
