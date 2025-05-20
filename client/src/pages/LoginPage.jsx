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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5050/auth/login', { email, password });

      const { token } = res.data;
      const decoded = JSON.parse(atob(token.split('.')[1])); // decode JWT payload

      setAuth({
        token,
        role: decoded.role,
        userId: decoded.userId
      });

      if (decoded.role === 'ngo') navigate('/ngo-dashboard');
      else if (decoded.role === 'volunteer') navigate('/volunteer-dashboard');
      else if (decoded.role === 'admin') navigate('/admin-dashboard');
      else setError('Unknown role');

    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;
