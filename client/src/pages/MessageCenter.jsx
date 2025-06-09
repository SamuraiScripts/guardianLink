import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './MessageCenter.css';

export default function MessageCenter() {
  const { auth } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations on component mount and when navigating back
  useEffect(() => {
    if (auth?.token) {
      loadConversations();
      loadUnreadCount();
    }
  }, [auth]);

  // Reload conversations when the component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (auth?.token) {
        loadConversations();
        loadUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [auth]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations from API
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5050/messages/inbox', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setConversations(response.data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load unread message count
  const loadUnreadCount = async () => {
    try {
      const response = await axios.get('http://localhost:5050/messages/unread-count', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5050/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setMessages(response.data);
      
      // Mark messages as read
      await markConversationAsRead(userId);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  // Mark all messages in conversation as read
  const markConversationAsRead = async (userId) => {
    try {
      await axios.patch(`http://localhost:5050/messages/mark-read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      
      // Update conversations to reflect read status
      loadConversations();
      loadUnreadCount();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.user._id);
    setError('');
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      
      await axios.post('http://localhost:5050/messages/send', {
        recipient: selectedConversation.user._id,
        content: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      // Clear the input
      setNewMessage('');
      
      // Reload messages and conversations
      await loadMessages(selectedConversation.user._id);
      await loadConversations();
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!auth?.token) {
    return <div className="message-center-error">Please log in to access messages.</div>;
  }

  return (
    <div className="message-center">
      <div className="message-center-header">
        <h1>Messages</h1>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
        )}
      </div>

      <div className="message-center-content">
        {/* Left Column - Conversations List */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <h2>Conversations</h2>
          </div>
          
          {loading ? (
            <div className="conversations-loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="conversations-empty">
              <p>No conversations yet.</p>
              <p>Start a new conversation from your dashboard by selecting a user to message.</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversationId}
                  className={`conversation-item ${
                    selectedConversation?.conversationId === conversation.conversationId ? 'active' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="conversation-info">
                    <div className="conversation-user">
                      <span className="user-name">{conversation.user.email}</span>
                      <span className="user-role">{conversation.user.role}</span>
                    </div>
                    <div className="conversation-preview">
                      <p className="last-message">
                        {conversation.lastMessage.content.length > 50
                          ? conversation.lastMessage.content.substring(0, 50) + '...'
                          : conversation.lastMessage.content
                        }
                      </p>
                      <span className="last-message-time">
                        {formatTimestamp(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="conversation-unread">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Chat Interface */}
        <div className="chat-panel">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <h3>{selectedConversation.user.email}</h3>
                <span className="user-role-badge">{selectedConversation.user.role}</span>
              </div>

              <div className="messages-container">
                <div className="messages-list">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message ${
                        message.sender === auth.userId ? 'sent' : 'received'
                      }`}
                    >
                      <div className="message-content">
                        <p>{message.content}</p>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {message.sender === auth.userId && (
                            <span className={`message-status ${message.isRead ? 'read' : 'unread'}`}>
                              {message.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="chat-placeholder-content">
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}
    </div>
  );
}

