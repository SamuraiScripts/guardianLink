import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function ProfilePage() {
  const { auth, setAuth } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const justCreatedProfileDataRef = useRef(null);

  // Load profile on mount
  useEffect(() => {
    if (!auth?.token) {
      console.error('ProfilePage useEffect - auth.token is null');
      return;
    }

    if (justCreatedProfileDataRef.current && auth?.refId && justCreatedProfileDataRef.current._id === auth.refId) {
      console.log('ProfilePage useEffect: Using profile data from justCreatedProfileDataRef post-creation.');
      setProfile(justCreatedProfileDataRef.current);
      setForm(justCreatedProfileDataRef.current);
      setEditing(false);
      setMessage('Profile created successfully!');
      justCreatedProfileDataRef.current = null;
      return;
    }

    let endpoint = '';
    if (auth.role === 'ngo') {
      endpoint = 'http://localhost:5050/ngos/me';
    } else if (auth.role === 'volunteer') {
      endpoint = 'http://localhost:5050/volunteers/me';
    } else if (auth.role === 'admin') {
      endpoint = 'http://localhost:5050/auth/me';
    } else {
      console.error('Unknown user role for profile fetch:', auth?.role);
      setMessage('Cannot load profile for unknown role.');
      setProfile(null);
      return;
    }
    if (!endpoint) {
        setProfile(null);
        return;
    }

    axios.get(endpoint, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    .then(res => {
      setProfile(res.data);
      setForm(res.data);
      setEditing(false);
      setMessage('');
      justCreatedProfileDataRef.current = null;
    })
    .catch(err => {
      console.error('ProfilePage useEffect - Error loading profile:', err, 'Current auth.refId from context:', auth?.refId);
      
      if (err.response && err.response.status === 404) {
        if (!auth?.refId) {
          console.log('ProfilePage useEffect - 404, auth.refId is null. Setting up for profile creation.');
          const initialFormData = auth.role === 'volunteer' 
            ? { email: auth.email || '', fullName: '', weeklyAvailability: '', areasOfExpertise: [] }
            : { email: auth.email || '', organizationName: '', areasOfConcern: [] };
          setProfile({}); 
          setForm(initialFormData);
          setEditing(true);
          setMessage('Please complete your profile.');
        } else {
          console.log('ProfilePage useEffect - 404, but auth.refId exists in context. Token likely stale for GET.');
          setMessage('Your profile is saved. For the best experience and to ensure all parts of the application are synchronized, please log out and log back in.');
          setEditing(false);
        }
      } else {
        console.log('ProfilePage useEffect - Non-404 error.');
        setMessage('Failed to load profile. ' + (err.response?.data?.error || err.message));
        setProfile(null);
        setEditing(false);
      }
    });
  }, [auth]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // Submit changes
  const handleSave = async () => {
    const isCreatingNewProfile = !profile?._id;

    let endpoint = '';
    if (auth.role === 'ngo') {
      endpoint = 'http://localhost:5050/ngos/me';
    } else if (auth.role === 'volunteer') {
      endpoint = 'http://localhost:5050/volunteers/me';
    } else if (auth.role === 'admin') {
      endpoint = 'http://localhost:5050/auth/me';
    } else {
      console.error('Unknown user role for saving:', auth.role);
      setMessage('Cannot save profile for unknown role.');
      return;
    }

    let dataToSubmit = form;
    let headers = { Authorization: `Bearer ${auth.token}` };

    if (auth.role === 'volunteer' && typeof form.areasOfExpertise === 'string') {
      form.areasOfExpertise = form.areasOfExpertise.split(',').map(s => s.trim()).filter(s => s);
    }
    if (auth.role === 'ngo' && typeof form.areasOfConcern === 'string') {
      form.areasOfConcern = form.areasOfConcern.split(',').map(s => s.trim()).filter(s => s);
    }

    if (auth.role === 'volunteer') {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'resumeUrl' && form[key] !== undefined && form[key] !== null) {
          formData.append(key, form[key]);
        }
      });
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      dataToSubmit = formData;
    }

    try {
      const res = await axios.patch(endpoint, dataToSubmit, { headers });
      
      let updatedProfileData = res.data;
      if (auth.role === 'volunteer') {
        updatedProfileData = res.data.volunteer || res.data;
      } else if (auth.role === 'ngo') {
        updatedProfileData = res.data.ngo || res.data;
      } else if (auth.role === 'admin') {
        updatedProfileData = res.data.user || res.data;
      }

      console.log('ProfilePage handleSave - isCreatingNewProfile:', isCreatingNewProfile);
      console.log('ProfilePage handleSave - updatedProfileData before setProfile:', updatedProfileData);

      setProfile(updatedProfileData);
      setForm(updatedProfileData);
      setEditing(false);
      setResumeFile(null);
      setMessage('Profile updated successfully!');

      if (isCreatingNewProfile && updatedProfileData?._id) {
        justCreatedProfileDataRef.current = updatedProfileData;
        const newAuthData = {
          ...auth,
          refId: updatedProfileData._id,
        };
        if (res.data.token) {
          newAuthData.token = res.data.token;
        }
        setAuth(newAuthData);
      }

    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Failed to update profile. ' + (err.response?.data?.error || err.message));
      if (err.response?.data?.details) {
        setError(JSON.stringify(err.response.data.details));
      }
    }
  };

  if (!profile && auth.role !== 'admin' && !(message && message.includes('complete your profile'))) {
    return <p>Loading profile...</p>;
  }

  const loginEmail = auth?.email || 'Email not available';

  return (
    <div>
      <h2>Your Profile</h2>
      {message && <p className={message.startsWith('Failed') || message.startsWith('Error') ? 'error-message' : 'success-message'}>{message}</p>}

      {auth.role === 'admin' ? (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label>Email:</label>
            <p style={{ marginTop: '5px' }}>{profile?.email || loginEmail}</p>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Role:</label>
            <p style={{ marginTop: '5px' }}>{profile?.role || auth.role}</p>
          </div>
        </div>
      ) : auth.role === 'ngo' ? (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="organizationName">Organization Name:</label>
            {editing ? (
              <input id="organizationName" name="organizationName" value={form.organizationName || ''} onChange={handleChange} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box' }} />
            ) : (
              <p style={{ marginTop: '5px' }}>{profile?.organizationName || form.organizationName /* Fallback for creation form */}</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="emailNgo">Login Email:</label>
            {editing ? (
              <p style={{ marginTop: '5px', backgroundColor: '#f0f0f0', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', width: '100%' }}>{loginEmail}</p>
            ) : (
              <p style={{ marginTop: '5px' }}>{loginEmail}</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="areasOfConcern">Areas of Concern (comma-separated):</label>
            {editing ? (
              <input 
                id="areasOfConcern"
                name="areasOfConcern" 
                value={Array.isArray(form.areasOfConcern) ? form.areasOfConcern.join(', ') : form.areasOfConcern || ''} 
                onChange={handleChange} 
                style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box' }}
              />
            ) : (
              <p style={{ marginTop: '5px' }}>{(Array.isArray(profile?.areasOfConcern) ? profile.areasOfConcern.join(', ') : profile?.areasOfConcern) || 'N/A'}</p>
            )}
          </div>
        </div>
      ) : auth.role === 'volunteer' ? (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="fullName">Full Name:</label>
            {editing ? (
              <input id="fullName" name="fullName" value={form.fullName || ''} onChange={handleChange} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box' }} />
            ) : (
              <p style={{ marginTop: '5px' }}>{profile?.fullName || form.fullName}</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="emailVolunteer">Login Email:</label>
            {editing ? (
              <p style={{ marginTop: '5px', backgroundColor: '#f0f0f0', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', width: '100%' }}>{loginEmail}</p>
            ) : (
              <p style={{ marginTop: '5px' }}>{loginEmail}</p>
            )}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="weeklyAvailability">Weekly Availability (hours):</label>
            {editing ? (
              <input type="number" id="weeklyAvailability" name="weeklyAvailability" value={form.weeklyAvailability || ''} onChange={handleChange} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box' }} />
            ) : (
              <p style={{ marginTop: '5px' }}>{profile?.weeklyAvailability}</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="areasOfExpertise">Areas of Expertise (comma-separated):</label>
            {editing ? (
              <input id="areasOfExpertise" name="areasOfExpertise" value={Array.isArray(form.areasOfExpertise) ? form.areasOfExpertise.join(', ') : form.areasOfExpertise || ''} onChange={handleChange} style={{ display: 'block', width: '100%', marginTop: '5px', boxSizing: 'border-box' }}/>
            ) : (
              <p style={{ marginTop: '5px' }}>{(Array.isArray(profile?.areasOfExpertise) ? profile.areasOfExpertise.join(', ') : profile?.areasOfExpertise) || 'N/A'}</p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="resume">Resume (PDF only):</label>
            {editing && (
                 <input type="file" id="resume" name="resume" onChange={handleFileChange} accept=".pdf,.doc,.docx" style={{ display: 'block', width: '100%', marginTop: '5px' }} />
            )}
            {!editing && profile?.resumeUrl && (
                 <p style={{ marginTop: '5px' }}><a href={`http://localhost:5050${profile.resumeUrl}`} target="_blank" rel="noopener noreferrer">View Resume</a></p>
            )}
            {!editing && !profile?.resumeUrl && (
                 <p style={{ marginTop: '5px' }}>N/A</p>
            )}
            {editing && profile?.resumeUrl && !resumeFile && (
                <p style={{marginTop: '5px', fontSize: '0.9em', color: 'gray'}}>Current file: {profile.resumeUrl.split('/').pop()}</p>
            )}
          </div>

        </div>
      ) : (
         <p>Profile information is not available for your role or an error occurred.</p>
      )}

      {!editing && auth.role !== 'admin' && profile && ( 
        <button onClick={() => setEditing(true)} style={{ marginRight: '10px' }}>Edit Profile</button>
      )}
      {editing && auth.role !== 'admin' && (
        <>
          <button onClick={handleSave} style={{ marginRight: '10px' }}>Save Changes</button>
          <button onClick={() => {
            setEditing(false);
            setForm(profile?._id ? profile : (auth.role === 'volunteer' 
                ? { fullName: '', weeklyAvailability: '', areasOfExpertise: [], resumeUrl: null }
                : { organizationName: '', areasOfConcern: [] }) 
            );
            setMessage(''); 
            setResumeFile(null); 
          }}>Cancel</button>
        </>
      )}
    </div>
  );
}

export default ProfilePage;
