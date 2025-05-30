import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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
    }
  };

  return (
    <div>
      <h2>Register as Volunteer</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
        /><br />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        /><br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        /><br />

        <input
          type="number"
          name="weeklyAvailability"
          placeholder="Hours per week"
          value={formData.weeklyAvailability}
          onChange={handleChange}
          required
        /><br />

        <input
          type="text"
          name="areasOfExpertise"
          placeholder="Areas of Expertise (comma-separated)"
          value={formData.areasOfExpertise}
          onChange={handleChange}
          required
        /><br />

        <label>
          <input
            type="checkbox"
            name="backgroundCheck"
            checked={formData.backgroundCheck}
            onChange={handleChange}
          />
          I confirm I have passed a criminal background check
        </label><br />

        <label>
          Upload Resume:
          <input
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            required
          />
        </label><br />

        <button type="submit">Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}
