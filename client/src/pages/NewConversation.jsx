import { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './NewConversation.css';

export default function NewConversation() {
  const { recipientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [actualRecipientId, setActualRecipientId] = useState(null);

  // Get recipient info and convert profile ID to user ID
  useEffect(() => {
    if (location.state?.recipientName && location.state?.recipientRole) {
      setRecipientInfo({
        name: location.state.recipientName,
        role: location.state.recipientRole
      });
      // Convert profile ID to user ID
      fetchUserIdFromProfile();
    } else {
      // Fetch recipient info if not provided in state
      fetchRecipientInfo();
    }
  }, [recipientId, location.state]);

  const fetchUserIdFromProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5050/messages/user-id/${recipientId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setActualRecipientId(response.data.userId);
      
      // If we didn't have recipient info from state, use the fetched info
      if (!recipientInfo) {
        setRecipientInfo({
          name: response.data.displayName || response.data.email,
          role: response.data.role
        });
      }
    } catch (err) {
      console.error('Error getting user ID:', err);
      setError('Failed to find recipient user information');
    }
  };

  const fetchRecipientInfo = async () => {
    // If no state was passed, try to get user info via the profile ID
    await fetchUserIdFromProfile();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);
      setError('');

      await axios.post('http://localhost:5050/messages/send', {
        recipient: actualRecipientId || recipientId,
        content: message.trim()
      }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      // Redirect to messages page after successful send
      navigate('/messages', { replace: true });
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (!auth?.token) {
    return (
      <div className="new-conversation-error">
        Please log in to send messages.
      </div>
    );
  }

  return (
    <div className="new-conversation">
      <div className="new-conversation-container">
        <div className="new-conversation-header">
          <h1>New Message</h1>
          {recipientInfo && (
            <p>
              Send a message to <strong>{recipientInfo.name}</strong>
              <span className="recipient-role">({recipientInfo.role})</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="new-conversation-form">
          <div className="message-input-section">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="message-textarea"
              rows={6}
              disabled={sending}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={!message.trim() || sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
