import { useNavigate } from 'react-router-dom';
import './Register.css';

export default function RegisterTypePage() {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Welcome to GuardianLink</h1>
          <p>Choose your account type to get started</p>
        </div>
        
        <div className="account-type-selection">
          <div className="account-type-card" onClick={() => navigate('/register-volunteer')}>
            <div className="account-type-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#646cff"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#646cff"/>
              </svg>
            </div>
            <h3>Volunteer</h3>
            <p>Join as a volunteer to contribute your skills and time to meaningful causes</p>
            <div className="account-type-button">
              Get Started as a Volunteer
            </div>
          </div>

          <div className="account-type-card" onClick={() => navigate('/register-ngo')}>
            <div className="account-type-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="#646cff"/>
                <path d="M12 9L15 12L12 15L9 12L12 9Z" fill="#646cff"/>
              </svg>
            </div>
            <h3>NGO</h3>
            <p>Register your organization to connect with passionate volunteers</p>
            <div className="account-type-button">
              Get Started as an NGO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
