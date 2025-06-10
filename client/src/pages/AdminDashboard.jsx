import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AdminDashboard.css'; // We'll create this for styling

export default function AdminDashboard() {
  const { auth } = useContext(AuthContext);
  const [usersWithProfiles, setUsersWithProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null); // ID of the user selected with checkbox
  const [expandedUserId, setExpandedUserId] = useState(null); // ID of the user whose details are expanded
  const [filter, setFilter] = useState('all'); // 'all', 'ngo', 'volunteer'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages from actions

  // States for action forms
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: '', password: '', role: 'volunteer' });

  const [showAssignRoleForm, setShowAssignRoleForm] = useState(false);
  const [assignRoleForm, setAssignRoleForm] = useState({ newRole: 'volunteer' });

  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth?.token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const [usersRes, ngosRes, volunteersRes] = await Promise.all([
          axios.get('http://localhost:5050/auth/users', { headers: { Authorization: `Bearer ${auth.token}` } }),
          axios.get('http://localhost:5050/ngos', { headers: { Authorization: `Bearer ${auth.token}` } }),
          axios.get('http://localhost:5050/volunteers', { headers: { Authorization: `Bearer ${auth.token}` } })
        ]);

        const users = usersRes.data;
        const ngos = ngosRes.data.reduce((acc, ngo) => ({ ...acc, [ngo._id]: ngo }), {});
        const volunteers = volunteersRes.data.reduce((acc, vol) => ({ ...acc, [vol._id]: vol }), {});

        const combined = users.map(user => {
          let profileData = {};
          if (user.role === 'ngo' && user.refId && ngos[user.refId]) {
            profileData = ngos[user.refId];
          } else if (user.role === 'volunteer' && user.refId && volunteers[user.refId]) {
            profileData = volunteers[user.refId];
          }
          return { ...user, profile: profileData };
        });
        setUsersWithProfiles(combined);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch user data. ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auth]);

  const handleInputChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Action Handlers (to be implemented) ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      // API call: POST /auth/users
      await axios.post('http://localhost:5050/auth/users', createUserForm, { headers: { Authorization: `Bearer ${auth.token}` } });
      setMessage('User created successfully!');
      setCreateUserForm({ email: '', password: '', role: 'volunteer' });
      setShowCreateUserForm(false);
      // Refetch data
      const usersRes = await axios.get('http://localhost:5050/auth/users', { headers: { Authorization: `Bearer ${auth.token}` } });
      const ngosRes = await axios.get('http://localhost:5050/ngos', { headers: { Authorization: `Bearer ${auth.token}` } });
      const volunteersRes = await axios.get('http://localhost:5050/volunteers', { headers: { Authorization: `Bearer ${auth.token}` } });
      const users = usersRes.data;
      const ngos = ngosRes.data.reduce((acc, ngo) => ({ ...acc, [ngo._id]: ngo }), {});
      const volunteers = volunteersRes.data.reduce((acc, vol) => ({ ...acc, [vol._id]: vol }), {});
      const combined = users.map(user => {
        let profileData = {};
        if (user.role === 'ngo' && user.refId && ngos[user.refId]) {
          profileData = ngos[user.refId];
        } else if (user.role === 'volunteer' && user.refId && volunteers[user.refId]) {
          profileData = volunteers[user.refId];
        }
        return { ...user, profile: profileData };
      });
      setUsersWithProfiles(combined);

    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to assign a role.');
      return;
    }
    setMessage('');
    setError('');
    try {
      // API call: PATCH /auth/users/:id/role
      await axios.patch(`http://localhost:5050/auth/users/${selectedUserId}/role`, { newRole: assignRoleForm.newRole }, { headers: { Authorization: `Bearer ${auth.token}` } });
      setMessage('Role assigned successfully!');
      setAssignRoleForm({ newRole: 'volunteer' });
      setShowAssignRoleForm(false);
      // Refetch data or update locally
       const usersRes = await axios.get('http://localhost:5050/auth/users', { headers: { Authorization: `Bearer ${auth.token}` } });
       const ngosRes = await axios.get('http://localhost:5050/ngos', { headers: { Authorization: `Bearer ${auth.token}` } });
       const volunteersRes = await axios.get('http://localhost:5050/volunteers', { headers: { Authorization: `Bearer ${auth.token}` } });
       const users = usersRes.data;
       const ngos = ngosRes.data.reduce((acc, ngo) => ({ ...acc, [ngo._id]: ngo }), {});
       const volunteers = volunteersRes.data.reduce((acc, vol) => ({ ...acc, [vol._id]: vol }), {});
       const combined = users.map(user => {
         let profileData = {};
         if (user.role === 'ngo' && user.refId && ngos[user.refId]) {
           profileData = ngos[user.refId];
         } else if (user.role === 'volunteer' && user.refId && volunteers[user.refId]) {
           profileData = volunteers[user.refId];
         }
         return { ...user, profile: profileData };
       });
       setUsersWithProfiles(combined);
    } catch (err) {
      console.error('Error assigning role:', err);
      setError('Failed to assign role. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user to reset password.');
      return;
    }
     setMessage('');
     setError('');
    try {
      // API call: PATCH /auth/users/:id/password
      await axios.patch(`http://localhost:5050/auth/users/${selectedUserId}/password`, { newPassword: resetPasswordForm.newPassword }, { headers: { Authorization: `Bearer ${auth.token}` } });
      setMessage('Password reset successfully!');
      setResetPasswordForm({ newPassword: '' });
      setShowResetPasswordForm(false);
      // No need to refetch data, password is not displayed
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) {
      setError('Please select a user to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    setMessage('');
    setError('');
    try {
      // API call: DELETE /auth/users/:id
      await axios.delete(`http://localhost:5050/auth/users/${selectedUserId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
      setMessage('User deleted successfully!');
      setSelectedUserId(null); // Deselect user
      // Refetch data
       const usersRes = await axios.get('http://localhost:5050/auth/users', { headers: { Authorization: `Bearer ${auth.token}` } });
       const ngosRes = await axios.get('http://localhost:5050/ngos', { headers: { Authorization: `Bearer ${auth.token}` } });
       const volunteersRes = await axios.get('http://localhost:5050/volunteers', { headers: { Authorization: `Bearer ${auth.token}` } });
       const users = usersRes.data;
       const ngos = ngosRes.data.reduce((acc, ngo) => ({ ...acc, [ngo._id]: ngo }), {});
       const volunteers = volunteersRes.data.reduce((acc, vol) => ({ ...acc, [vol._id]: vol }), {});
       const combined = users.map(user => {
         let profileData = {};
         if (user.role === 'ngo' && user.refId && ngos[user.refId]) {
           profileData = ngos[user.refId];
         } else if (user.role === 'volunteer' && user.refId && volunteers[user.refId]) {
           profileData = volunteers[user.refId];
         }
         return { ...user, profile: profileData };
       });
       setUsersWithProfiles(combined);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredUsers = usersWithProfiles.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  if (loading) return <p>Loading dashboard...</p>;
  // Error covering the whole page if auth token is missing or initial load fails critically
  if (!auth?.token && error) return <p style={{ color: 'red' }}>Error: {error}</p>;


  return (
    <div className="page-container">
      <div className="page-content">
        <div className="admin-main-content">
          <header>
            <h1>Admin Dashboard</h1>
          </header>
          {message && <p className="success-message">{message}</p>}
          {error && !message && <p className="error-message">{error}</p>} {/* Show general error if no specific success message */}

          <div className="dashboard-content">
            <div className="user-list-section">
              <h2>Users</h2>
              {/* Filter Dropdown */}
              <div className="action-item">
                <label htmlFor="filter">Filter by type: </label>
                <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
              {filteredUsers.length === 0 && !loading && <p>No users found.</p>}
              <ul>
                {filteredUsers.map(user => (
                  <li key={user._id} className={`user-item ${selectedUserId === user._id ? 'selected' : ''}`}>
                    <div className="user-item-header" onClick={() => setExpandedUserId(expandedUserId === user._id ? null : user._id)}>
                      <input
                        type="checkbox"
                        checked={selectedUserId === user._id}
                        onChange={() => setSelectedUserId(selectedUserId === user._id ? null : user._id)}
                        onClick={(e) => e.stopPropagation()} // Prevent row click when checkbox is clicked
                      />
                      <span>
                        {user.role === 'ngo' ? user.profile?.organizationName || user.email : user.profile?.fullName || user.email} ({user.role})
                      </span>
                      <span>{expandedUserId === user._id ? '▼' : '▶'}</span>
                    </div>
                    {expandedUserId === user._id && (
                      <div className="user-details">
                        <p><strong>Email:</strong> {user.email}</p>
                        {user.role === 'volunteer' && user.profile && (
                          <>
                            <p><strong>Full Name:</strong> {user.profile.fullName}</p>
                            <p><strong>Weekly Availability (hrs):</strong> {user.profile.weeklyAvailability}</p>
                            <p><strong>Areas of Expertise:</strong> {(Array.isArray(user.profile.areasOfExpertise) ? user.profile.areasOfExpertise.join(', ') : user.profile.areasOfExpertise) || 'N/A'}</p>
                            {user.profile.resumeUrl ? (
                              <p><strong>Resume:</strong> <a href={`http://localhost:5050${user.profile.resumeUrl}`} target="_blank" rel="noopener noreferrer">View Resume</a></p>
                            ) : <p><strong>Resume:</strong> N/A</p>}
                          </>
                        )}
                        {user.role === 'ngo' && user.profile && (
                          <>
                            <p><strong>Organization Name:</strong> {user.profile.organizationName}</p>
                            <p><strong>Areas of Concern:</strong> {(Array.isArray(user.profile.areasOfConcern) ? user.profile.areasOfConcern.join(', ') : user.profile.areasOfConcern) || 'N/A'}</p>
                          </>
                        )}
                         {!user.refId && <p><em>Profile data not yet created for this user.</em></p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="actions-section">
              <h2>Actions</h2>

              {/* Create User */}
              <div className="action-item">
                <button onClick={() => {setShowCreateUserForm(!showCreateUserForm); setShowAssignRoleForm(false); setShowResetPasswordForm(false);}}>Create User</button>
                {showCreateUserForm && (
                  <form onSubmit={handleCreateUser} className="action-form">
                    <h3>Create New User</h3>
                    <input type="email" name="email" value={createUserForm.email} onChange={handleInputChange(setCreateUserForm)} placeholder="Email" required />
                    <input type="password" name="password" value={createUserForm.password} onChange={handleInputChange(setCreateUserForm)} placeholder="Password" required />
                    <select name="role" value={createUserForm.role} onChange={handleInputChange(setCreateUserForm)}>
                      <option value="volunteer">Volunteer</option>
                      <option value="ngo">NGO</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit">Submit</button>
                  </form>
                )}
              </div>
              
              {/* Assign Role */}
              <div className="action-item">
                 <button onClick={() => {setShowAssignRoleForm(!showAssignRoleForm); setShowCreateUserForm(false); setShowResetPasswordForm(false);}} disabled={!selectedUserId}>Assign Role</button>
                {showAssignRoleForm && selectedUserId && (
                  <form onSubmit={handleAssignRole} className="action-form">
                    <h3>Assign Role to {usersWithProfiles.find(u=>u._id === selectedUserId)?.email}</h3>
                    <select name="newRole" value={assignRoleForm.newRole} onChange={handleInputChange(setAssignRoleForm)}>
                      <option value="volunteer">Volunteer</option>
                      <option value="ngo">NGO</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit">Submit</button>
                  </form>
                )}
              </div>

              {/* Reset Password */}
              <div className="action-item">
                <button onClick={() => {setShowResetPasswordForm(!showResetPasswordForm); setShowCreateUserForm(false); setShowAssignRoleForm(false);}} disabled={!selectedUserId}>Reset Password</button>
                {showResetPasswordForm && selectedUserId && (
                  <form onSubmit={handleResetPassword} className="action-form">
                     <h3>Reset Password for {usersWithProfiles.find(u=>u._id === selectedUserId)?.email}</h3>
                    <input type="password" name="newPassword" value={resetPasswordForm.newPassword} onChange={handleInputChange(setResetPasswordForm)} placeholder="New Password" required />
                    <button type="submit">Submit</button>
                  </form>
                )}
              </div>

              {/* Delete User */}
              <div className="action-item">
                <button onClick={handleDeleteUser} disabled={!selectedUserId}>Delete Selected User</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="admin-sidebar-space">
          {/* Future space for images */}
        </div>
      </div>
    </div>
  );
}
