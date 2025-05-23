import { useNavigate } from 'react-router-dom';

export default function RegisterTypePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Select Account Type</h2>
      <p>Please choose what kind of account you want to register:</p>
      <button onClick={() => navigate('/register-volunteer')}>Volunteer Registration</button>
      <button onClick={() => navigate('/register-ngo')} style={{ marginLeft: '1rem' }}>NGO Registration</button>
    </div>
  );
}
