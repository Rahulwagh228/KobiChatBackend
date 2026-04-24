# ChatApp Backend API Documentation

## Base Configuration

- **Backend URL**: `http://localhost:4000` (dev) | `https://your-domain.com` (prod)
- **JWT Token Expiry**: 7 days
- **JWT Format**: Bearer token in Authorization header

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Required Fields:**
- `username` (string) - must be unique
- `email` (string) - must be valid and unique
- `password` (string) - minimum recommended 8 characters

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6745a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- **400** - Missing fields:
  ```json
  { "msg": "All fields are required" }
  ```
- **400** - User already exists:
  ```json
  { "msg": "User already exists" }
  ```
- **500** - Server error:
  ```json
  { "msg": "Server error" }
  ```

---

### 1.2 Login User
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "emailOrUsername": "john_doe",
  "password": "SecurePassword123!"
}
```

**Parameters:**
- `emailOrUsername` (string) - email or username (accepts both)
- `password` (string)

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6745a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- **400** - Invalid credentials:
  ```json
  { "msg": "Invalid credentials" }
  ```
- **500** - Server error:
  ```json
  { "msg": "Server error" }
  ```

---

## 2. AUTHENTICATED REQUESTS

All conversation/message endpoints require authentication.

**Header Format:**
```
Authorization: Bearer <token>
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. CONVERSATION ENDPOINTS

### 3.1 Create Conversation
**POST** `/api/conversations/create`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ParticipantEmailOrName": "jane_doe"
}
```

**Parameters:**
- `ParticipantEmailOrName` (string) - username or email of the other user

**Success Response (200):**
```json
{
  "success": true,
  "conversation": {
    "_id": "6745a1b2c3d4e5f6g7h8i9j0",
    "participants": [
      {
        "_id": "user2_id",
        "username": "jane_doe",
        "email": "jane@example.com",
        "avatarImage": "avatar_url"
      }
    ],
    "createdAt": "2026-04-24T10:30:00.000Z",
    "updatedAt": "2026-04-24T10:30:00.000Z"
  }
}
```

**Error Responses:**
- **400** - Missing field:
  ```json
  { "success": false, "msg": "ParticipantEmailOrName is required" }
  ```
- **400** - Trying to chat with yourself:
  ```json
  { "success": false, "msg": "Cannot create conversation with yourself" }
  ```
- **404** - User not found:
  ```json
  { "success": false, "msg": "User with this username not found" }
  ```

---

### 3.2 Get All Conversations
**GET** `/api/conversations/`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "conv_id_1",
      "participants": [
        {
          "_id": "user2_id",
          "username": "jane_doe",
          "avatarImage": "url"
        }
      ],
      "lastMessage": {
        "_id": "msg_id",
        "sender": {
          "_id": "user2_id",
          "username": "jane_doe"
        },
        "content": "Hey there!",
        "createdAt": "2026-04-24T10:35:00.000Z"
      },
      "createdAt": "2026-04-24T10:30:00.000Z",
      "updatedAt": "2026-04-24T10:35:00.000Z"
    }
  ]
}
```

---

### 3.3 Get Conversation Messages
**GET** `/api/conversations/:conversationId/messages`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `conversationId` (string) - MongoDB ObjectId of the conversation

**Success Response (200):**
```json
{
  "success": true,
  "conversationId": "6745a1b2c3d4e5f6g7h8i9j0",
  "messages": [
    {
      "_id": "msg_id_1",
      "sender": "jane_doe",
      "senderId": "user2_id",
      "content": "Hello!",
      "readBy": [],
      "createdAt": "2026-04-24T10:31:00.000Z",
      "updatedAt": "2026-04-24T10:31:00.000Z"
    },
    {
      "_id": "msg_id_2",
      "sender": "john_doe",
      "senderId": "current_user_id",
      "content": "Hi there!",
      "readBy": [],
      "createdAt": "2026-04-24T10:32:00.000Z",
      "updatedAt": "2026-04-24T10:32:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **403** - Unauthorized:
  ```json
  { "success": false, "msg": "Unauthorized access" }
  ```
- **404** - Conversation not found:
  ```json
  { "success": false, "msg": "Conversation not found" }
  ```

---

### 3.4 Get All Conversation People
**GET** `/api/conversations/people/all`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "people": [
    {
      "id": "user2_id",
      "username": "jane_doe",
      "email": "jane@example.com",
      "avatarImage": "url"
    },
    {
      "id": "user3_id",
      "username": "bob_smith",
      "email": "bob@example.com",
      "avatarImage": "url"
    }
  ]
}
```

---

## 4. REAL-TIME MESSAGING (Socket.io)

### 4.1 Connection Setup

**JavaScript/Node.js:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Authenticate after connection
socket.on('connect', () => {
  socket.emit('auth', { token: '<your-jwt-token>' });
});
```

**React Example:**
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (token) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000');
    
    newSocket.on('connect', () => {
      console.log('Connected');
      newSocket.emit('auth', { token });
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  return socket;
};
```

---

### 4.2 Socket Events

#### Join Conversation
```javascript
socket.emit('join-conversation', conversationId);
// Response: User joins the room and receives real-time messages
```

#### Send Message
```javascript
socket.emit('message:send', {
  text: "Hello!",
  recipientId: "user2_id",
  conversationId: "conversation_id",
  timestamp: new Date().toISOString()
}, (ack) => {
  if (ack.success) {
    console.log('Message sent:', ack.messageId);
  } else {
    console.error('Failed to send:', ack.msg);
  }
});
```

**Parameters:**
- `text` (string) - message content
- `recipientId` (string) - userId of the recipient
- `conversationId` (string) - the conversation ID
- `timestamp` (ISO string) - when the message was sent

#### Receive New Message
```javascript
socket.on('new-message', ({ message, conversationId }) => {
  console.log('New message:', message);
  // message object:
  // {
  //   _id: "msg_id",
  //   text: "Hello!",
  //   sender: "sender_user_id",
  //   conversationId: "conv_id",
  //   timestamp: "2026-04-24T10:32:00.000Z"
  // }
});
```

#### Typing Indicator
```javascript
// Send typing status
socket.emit('typing', {
  conversationId: "conversation_id",
  isTyping: true  // false when stopped
});

// Receive typing status
socket.on('typing', ({ userId, isTyping }) => {
  if (isTyping) {
    console.log(`${userId} is typing...`);
  }
});
```

#### Online Users
```javascript
socket.on('online-users', (userIds) => {
  console.log('Online users:', userIds);
  // userIds: ["user_id_1", "user_id_2", ...]
});
```

---

## 5. COMPLETE EXAMPLE (React)

```javascript
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';
let socket = null;

export default function ChatApp() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Register
  const handleRegister = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        username,
        email,
        password
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (error) {
      console.error('Register failed:', error.response?.data?.msg);
    }
  };

  // Login
  const handleLogin = async (emailOrUsername, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        emailOrUsername,
        password
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (error) {
      console.error('Login failed:', error.response?.data?.msg);
    }
  };

  // Initialize socket
  useEffect(() => {
    if (!token) return;

    socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('auth', { token });
    });

    socket.on('new-message', ({ message, conversationId }) => {
      if (selectedConv._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('online-users', (userIds) => {
      setOnlineUsers(userIds);
    });

    socket.on('typing', ({ userId, isTyping }) => {
      console.log(`${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
    });

    return () => socket.disconnect();
  }, [token]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Fetch conversations failed:', error.response?.data?.msg);
    }
  };

  // Fetch messages
  const fetchMessages = async (conversationId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Fetch messages failed:', error.response?.data?.msg);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    socket.emit('message:send', {
      text: messageText,
      recipientId: selectedConv.participants[0]._id,
      conversationId: selectedConv._id,
      timestamp: new Date().toISOString()
    }, (ack) => {
      if (ack.success) {
        setMessageText('');
      } else {
        console.error('Send failed:', ack.msg);
      }
    });
  };

  // Create conversation
  const handleCreateConversation = async (usernameOrEmail) => {
    try {
      const res = await axios.post(
        `${API_BASE}/conversations/create`,
        { ParticipantEmailOrName: usernameOrEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(prev => [...prev, res.data.conversation]);
    } catch (error) {
      console.error('Create conversation failed:', error.response?.data?.msg);
    }
  };

  // Select conversation
  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    socket.emit('join-conversation', conv._id);
    fetchMessages(conv._id);
  };

  if (!token) {
    return <LoginComponent onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="chat-app">
      <div className="sidebar">
        <button onClick={fetchConversations}>Refresh</button>
        <div className="conversations">
          {conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => handleSelectConversation(conv)}
              className={selectedConv?._id === conv._id ? 'active' : ''}
            >
              {conv.participants[0]?.username}
              {onlineUsers.includes(conv.participants[0]?._id) && (
                <span className="online-indicator">●</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {selectedConv ? (
          <>
            <div className="messages">
              {messages.map(msg => (
                <div key={msg._id} className={`message ${msg.senderId === user.id ? 'own' : ''}`}>
                  <strong>{msg.sender}:</strong> {msg.content}
                </div>
              ))}
            </div>
            <div className="input-area">
              <input
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p>Select a conversation</p>
        )}
      </div>
    </div>
  );
}
```

---

## 6. COMMON ERRORS & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| "No token, authorization denied" | Missing Bearer token | Include `Authorization: Bearer <token>` header |
| "Invalid token" | Expired or malformed JWT | Login again to get new token |
| "User already exists" | Username or email taken | Use different credentials |
| "Cannot create conversation with yourself" | Trying to chat with own account | Use different user account |
| Socket connection fails | CORS or wrong URL | Check server URL and CORS config |
| Messages not received | Not in same room | Call `join-conversation` first |

---

## 7. ENVIRONMENT SETUP

### Backend (.env file)
```
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-secret-key-here
```

### Frontend (.env file)
```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

---

## 8. TOKEN STORAGE

**Best Practice:**
```javascript
// Save token
localStorage.setItem('token', token);

// Retrieve token
const token = localStorage.getItem('token');

// Remove token (logout)
localStorage.removeItem('token');

// Use in headers
const config = {
  headers: { Authorization: `Bearer ${token}` }
};
```

---

## 9. CORS CONFIGURATION

**Current Backend CORS (Development):**
```
cors({ origin: '*' })
```

**For Production:** Specify allowed origins:
```javascript
cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true
})
```

---

## 10. QUICK REFERENCE

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | ❌ | Create account |
| `/api/auth/login` | POST | ❌ | Login |
| `/api/conversations/` | GET | ✅ | Get all conversations |
| `/api/conversations/create` | POST | ✅ | Create new conversation |
| `/api/conversations/:id/messages` | GET | ✅ | Get messages |
| `/api/conversations/people/all` | GET | ✅ | Get all chat people |

**Socket Events:**
- `auth` - Authenticate
- `join-conversation` - Join room
- `message:send` - Send message
- `new-message` - Receive message (listen)
- `typing` - Send/receive typing
- `online-users` - Get online list (listen)
