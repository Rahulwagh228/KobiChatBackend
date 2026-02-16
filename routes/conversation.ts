import express from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  createConversation,
  getUserConversations,
  getConversationMessages,
  getAllConversationPeople,
} from '../controllers/conversationController';

const router = express.Router();

// Create a new conversation
router.post('/create', authMiddleware, createConversation);

// Get all conversations for the current user
router.get('/', authMiddleware, getUserConversations);

// Get all people the user has conversations with
router.get('/people/all', authMiddleware, getAllConversationPeople);

// Get messages for a specific conversation
router.get('/:conversationId/messages', authMiddleware, getConversationMessages);

export default router;