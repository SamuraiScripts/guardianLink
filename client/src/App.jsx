import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import NGODashboard from './pages/NGODashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
