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

    // Setup with JWT
    socket.on('setup', async ({ token }: { token: string }) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as JwtPayload;

        const userId = decoded.id;
        socket.userId = userId;

        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);

        socket.join(userId);

        io.emit('online-users', Array.from(onlineUsers.keys()));
      } catch (e: any) {
        console.warn('Socket setup failed:', e.message);
      }
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId);
    });

    // Private message sending
    socket.on(
      'private-message',
      async (conversationId: string, content: string, to?: string) => {
        if (!socket.userId) return;

        try {
          const msg = await new Message({
            conversationId,
            sender: socket.userId,
            content,
          }).save();

          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: msg._id,
          });

          io.to(conversationId).emit('new-message', {
            message: msg,
            conversationId,
          });

          if (to) {
            io.to(to).emit('new-message-notif', {
              message: msg,
              from: socket.userId,
            });
          }
        } catch (err) {
          console.error('Error sending message:', err);
        }
      }
    );

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
