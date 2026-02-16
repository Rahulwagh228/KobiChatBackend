import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Conversation from '../models/conversation';
import Message from '../models/Message';

const onlineUsers = new Map<string, Set<string>>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JwtPayload {
  id: string;
  [key: string]: any;
}

export const handleSocketConnection = (io: Server): void => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('Socket connected:', socket.id);

    // Setup authentication with JWT
    socket.on('auth', async ({ token }: { token: string }) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as JwtPayload;

        console.log("User authenticated:", decoded.id);
        const userId = decoded.id;
        socket.userId = userId;

        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);

        socket.join(userId);

        io.emit('online-users', Array.from(onlineUsers.keys()));
      } catch (e: any) {
        console.warn('Socket authentication failed:', e.message);
      }
    });

    // Send message
    socket.on(
      'message:send',
      async (
        { text, recipientId, conversationId, timestamp }: {
          text: string;
          recipientId: string;
          conversationId: string;
          timestamp: string;
        },
        callback?: (ack: any) => void
      ) => {
        if (!socket.userId) {
          callback?.({ success: false, msg: 'Not authenticated' });
          return;
        }

        try {
          // Save message to database
          const msg = await new Message({
            conversationId,
            sender: socket.userId,
            content: text,
          }).save();

          // Update conversation's lastMessage
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: msg._id,
          });

          const messagePayload = {
            _id: msg._id,
            text,
            sender: socket.userId,
            conversationId,
            timestamp,
          };

          // Deliver to conversation room (all participants)
          io.to(conversationId).emit('new-message', {
            message: messagePayload,
            conversationId,
          });

          // Send notification to recipient
          io.to(recipientId).emit('new-message-notif', {
            message: messagePayload,
            from: socket.userId,
            conversationId,
          });

          // Send acknowledgment back to sender
          callback?.({ success: true, messageId: msg._id });

          console.log(`✅ Message sent from ${socket.userId} to ${recipientId} in conversation ${conversationId}`);
        } catch (err: any) {
          console.error('Error sending message:', err);
          callback?.({ success: false, msg: 'Failed to send message', error: err.message });
        }
      }
    );

    // Join conversation room
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on(
      'typing',
      ({
        conversationId,
        isTyping,
      }: {
        conversationId: string;
        isTyping: boolean;
      }) => {
        if (!socket.userId) return;

        socket.to(conversationId).emit('typing', {
          userId: socket.userId,
          isTyping,
        });
      }
    );

    // Disconnect handler
    socket.on('disconnect', () => {
      if (socket.userId && onlineUsers.has(socket.userId)) {
        onlineUsers.get(socket.userId)!.delete(socket.id);

        if (onlineUsers.get(socket.userId)!.size === 0) {
          onlineUsers.delete(socket.userId);
        }
      }

      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('Socket disconnected:', socket.id);
    });
  });
};

export { onlineUsers };
