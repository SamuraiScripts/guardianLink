import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function ProfilePage() {
  const { auth } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');

  // Load profile on mount
  useEffect(() => {
    if (!auth?.role) return;

    const endpoint = auth.role === 'ngo'
      ? 'http://localhost:5050/ngos/me'
      : 'http://localhost:5050/volunteers/me';

    axios.get(endpoint, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    .then(res => {
      setProfile(res.data);
      setForm(res.data);
    })
    .catch(err => {
      console.error('Error loading profile:', err);
      setMessage('Failed to load profile');
    });
  }, [auth]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit changes
  const handleSave = async () => {
    const endpoint = auth.role === 'ngo'
      ? 'http://localhost:5050/ngos/me'
      : 'http://localhost:5050/volunteers/me';

    try {
      const res = await axios.patch(endpoint, form, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setProfile(res.data.ngo || res.data.volunteer); // res will return one of these
      setEditing(false);
      setMessage('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Failed to update profile');
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div>
      <h2>Your Profile</h2>
      {message && <p>{message}</p>}

      {auth.role === 'ngo' ? (
        <div>
          <label>Organization Name:</label><br />
          {editing ? (
            <input name="organizationName" value={form.organizationName || ''} onChange={handleChange} />
          ) : (
            <p>{profile.organizationName}</p>
          )}

          <label>Contact Email:</label><br />
          {editing ? (
            <input name="email" value={form.email || ''} onChange={handleChange} />
          ) : (
            <p>{profile.email}</p>
          )}

          <label>Areas of Concern:</label><br />
          {editing ? (
            <input name="areasOfConcern" value={form.areasOfConcern || ''} onChange={handleChange} />
          ) : (
            <p>{profile.areasOfConcern}</p>
          )}
        </div>
      ) : (
        <div>
          <label>Full Name:</label><br />
          {editing ? (
            <input name="fullName" value={form.fullName || ''} onChange={handleChange} />
          ) : (
            <p>{profile.fullName}</p>
          )}

          <label>Email:</label><br />
          {editing ? (
            <input name="email" value={form.email || ''} onChange={handleChange} />
          ) : (
            <p>{profile.email}</p>
          )}

          <label>Weekly Availability (hrs):</label><br />
          {editing ? (
            <input name="weeklyAvailability" value={form.weeklyAvailability || ''} onChange={handleChange} />
          ) : (
            <p>{profile.weeklyAvailability}</p>
          )}

          <label>Areas of Expertise:</label><br />
          {editing ? (
            <input name="areasOfExpertise" value={form.areasOfExpertise || ''} onChange={handleChange} />
          ) : (
            <p>{profile.areasOfExpertise}</p>
          )}
        </div>
      )}

      <br />
      {editing ? (
        <>
          <button onClick={handleSave}>Save Changes</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>
      ) : (
        <button onClick={() => setEditing(true)}>Edit Profile</button>
      )}
    </div>
  );
}

export default ProfilePage;
