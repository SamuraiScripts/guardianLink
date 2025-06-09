import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterTypePage from './pages/RegisterTypePage';
import RegisterVolunteerPage from './pages/RegisterVolunteerPage';
import RegisterNGOPage from './pages/RegisterNGOPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import MessageCenter from './pages/MessageCenter';
import NewConversation from './pages/NewConversation';

function App() {
  return (
    <Router>
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-type" element={<RegisterTypePage />} />
        <Route path="/register-volunteer" element={<RegisterVolunteerPage />} />
        <Route path="/register-ngo" element={<RegisterNGOPage />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route path="/ngo-dashboard" element={<NGODashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<MessageCenter />} />
        <Route path="/messages/new/:recipientId" element={<NewConversation />} />
      </Routes>
    </Router>
  );
}

export default App;
