import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function RegisterNgoPage() {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [areasOfConcern, setAreasOfConcern] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

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
    }
  };

  return (
    <div>
      <h2>NGO Registration</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Organization Name"
          value={organizationName}
          onChange={e => setOrganizationName(e.target.value)}
          required
        /><br />

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

        <input
          type="text"
          placeholder="Areas of Concern (comma-separated)"
          value={areasOfConcern}
          onChange={e => setAreasOfConcern(e.target.value)}
        /><br />

        <button type="submit">Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default RegisterNgoPage;
