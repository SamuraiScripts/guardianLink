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
    <div className="page-container">
      <div className="page-content">
        <div className="main-content">
          <h1>Your Profile</h1>
          
          {message && (
            <div style={{ 
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '25px',
              backgroundColor: message.startsWith('Failed') || message.startsWith('Error') ? '#f8d7da' : '#d4edda',
              color: message.startsWith('Failed') || message.startsWith('Error') ? '#721c24' : '#155724',
              border: `1px solid ${message.startsWith('Failed') || message.startsWith('Error') ? '#f5c6cb' : '#c3e6cb'}`,
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          {auth.role === 'admin' ? (
            <div style={{ display: 'grid', gap: '25px' }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ 
                  color: '#495057', 
                  marginBottom: '15px', 
                  fontSize: '18px',
                  fontWeight: '600',
                  borderBottom: '2px solid #dee2e6',
                  paddingBottom: '8px'
                }}>
                  Account Information
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email Address:
                  </label>
                  <p style={{ 
                    margin: '0',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#212529'
                  }}>
                    {profile?.email || loginEmail}
                  </p>
                </div>
                
                <div style={{ marginBottom: '0' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Role:
                  </label>
                  <p style={{ 
                    margin: '0',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#212529'
                  }}>
                    <span style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {profile?.role || auth.role}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : auth.role === 'ngo' ? (
            <div style={{ display: 'grid', gap: '25px' }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ 
                  color: '#495057', 
                  marginBottom: '15px', 
                  fontSize: '18px',
                  fontWeight: '600',
                  borderBottom: '2px solid #dee2e6',
                  paddingBottom: '8px'
                }}>
                  Organization Information
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Organization Name:
                  </label>
                  {editing ? (
                    <input 
                      id="organizationName" 
                      name="organizationName" 
                      value={form.organizationName || ''} 
                      onChange={handleChange} 
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  ) : (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {profile?.organizationName || form.organizationName || 'Not specified'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Login Email:
                  </label>
                  <p style={{ 
                    margin: '0',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#212529'
                  }}>
                    {profile?.email || loginEmail}
                  </p>
                </div>

                <div style={{ marginBottom: '0' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Areas of Concern:
                  </label>
                  {editing ? (
                    <textarea 
                      id="areasOfConcern" 
                      name="areasOfConcern" 
                      value={Array.isArray(form.areasOfConcern) ? form.areasOfConcern.join(', ') : (form.areasOfConcern || '')} 
                      onChange={handleChange}
                      placeholder="e.g., Data Security, Network Security, Incident Response"
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        minHeight: '100px',
                        resize: 'vertical',
                        transition: 'border-color 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  ) : (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {(Array.isArray(profile?.areasOfConcern) ? profile.areasOfConcern.join(', ') : profile?.areasOfConcern) || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : auth.role === 'volunteer' ? (
            <div style={{ display: 'grid', gap: '25px' }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ 
                  color: '#495057', 
                  marginBottom: '15px', 
                  fontSize: '18px',
                  fontWeight: '600',
                  borderBottom: '2px solid #dee2e6',
                  paddingBottom: '8px'
                }}>
                  Personal Information
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Full Name:
                  </label>
                  {editing ? (
                    <input 
                      id="fullName" 
                      name="fullName" 
                      value={form.fullName || ''} 
                      onChange={handleChange} 
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  ) : (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {profile?.fullName || form.fullName || 'Not specified'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Login Email:
                  </label>
                  <p style={{ 
                    margin: '0',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#212529'
                  }}>
                    {profile?.email || loginEmail}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Weekly Availability (Hours):
                  </label>
                  {editing ? (
                    <input 
                      type="number" 
                      id="weeklyAvailability" 
                      name="weeklyAvailability" 
                      value={form.weeklyAvailability || ''} 
                      onChange={handleChange} 
                      min="0" 
                      max="168" 
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  ) : (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {profile?.weeklyAvailability !== undefined ? `${profile.weeklyAvailability} hours` : (form.weeklyAvailability !== undefined ? `${form.weeklyAvailability} hours` : 'Not specified')}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Areas of Expertise:
                  </label>
                  {editing ? (
                    <textarea 
                      id="areasOfExpertise" 
                      name="areasOfExpertise" 
                      value={Array.isArray(form.areasOfExpertise) ? form.areasOfExpertise.join(', ') : (form.areasOfExpertise || '')} 
                      onChange={handleChange}
                      placeholder="e.g., Network Security, Penetration Testing, Incident Response"
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        minHeight: '100px',
                        resize: 'vertical',
                        transition: 'border-color 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                    />
                  ) : (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      {(Array.isArray(profile?.areasOfExpertise) ? profile.areasOfExpertise.join(', ') : profile?.areasOfExpertise) || 'Not specified'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '0' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    color: '#495057', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Resume:
                  </label>
                  {editing && (
                    <input 
                      type="file" 
                      id="resume" 
                      name="resume" 
                      onChange={handleFileChange} 
                      accept=".pdf,.doc,.docx" 
                      style={{ 
                        width: '100%', 
                        padding: '12px',
                        border: '2px dashed #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        backgroundColor: '#f8f9fa'
                      }} 
                    />
                  )}
                  {!editing && profile?.resumeUrl && (
                    <div style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#212529'
                    }}>
                      <a 
                        href={`http://localhost:5050${profile.resumeUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#3498db',
                          textDecoration: 'none',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        📄 View Resume
                      </a>
                    </div>
                  )}
                  {!editing && !profile?.resumeUrl && (
                    <p style={{ 
                      margin: '0',
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '16px',
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      No resume uploaded
                    </p>
                  )}
                  {editing && profile?.resumeUrl && !resumeFile && (
                    <p style={{
                      marginTop: '8px', 
                      fontSize: '14px', 
                      color: '#6c757d',
                      fontStyle: 'italic'
                    }}>
                      Current file: {profile.resumeUrl.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', fontSize: '16px' }}>
                Profile information is not available for your role or an error occurred.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            marginTop: '30px', 
            padding: '20px 0',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-start'
          }}>
            {!editing && auth.role !== 'admin' && profile && ( 
              <button 
                onClick={() => setEditing(true)} 
                style={{ 
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                Edit Profile
              </button>
            )}
            {editing && auth.role !== 'admin' && (
              <>
                <button 
                  onClick={handleSave} 
                  style={{ 
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setEditing(false);
                    setForm(profile?._id ? profile : (auth.role === 'volunteer' 
                        ? { fullName: '', weeklyAvailability: '', areasOfExpertise: [], resumeUrl: null }
                        : { organizationName: '', areasOfConcern: [] }) 
                    );
                    setMessage(''); 
                    setResumeFile(null); 
                  }}
                  style={{ 
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="sidebar-space">
          <img 
            src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="Professional profile" 
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '400px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
