import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Conversation from '../models/conversation';
import Message from '../models/Message';

// Map userId => socketId(s) to support multiple devices
const onlineUsers = new Map<string, Set<string>>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface JwtPayload {
  id: string;
  [key: string]: any;
}

export const handleSocketConnection = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('socket connected', socket.id);

    // client should emit 'setup' after connecting with { token }
    socket.on('setup', async ({ token }: { token: string }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        const userId = decoded.id;
        socket.userId = userId;
        
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);
        
        // join personal room
        socket.join(userId);
        
        // broadcast online users
        io.emit('online-users', Array.from(onlineUsers.keys()));
      } catch (e: any) {
        console.warn('socket setup failed:', e.message);
      }
    });


    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId); // so room messages are scoped
    });

    socket.on('private-message', async (conversationId: string, content: string, to?: string) => {
      try {
        // save message
        const msg = await new Message({ 
          conversationId, 
          sender: socket.userId, 
          content 
        }).save();
        
        await Conversation.findByIdAndUpdate(conversationId, { 
          lastMessage: msg._id 
        });

        // emit to room
        io.to(conversationId).emit('new-message', { 
          message: msg, 
          conversationId 
        });

        // optionally notify recipient's personal room
        if (to) {
          io.to(to).emit('new-message-notif', { 
            message: msg, 
            from: socket.userId 
          });
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });
    console.log("Socket working 22")

    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(conversationId).emit('typing', { 
        userId: socket.userId, 
        isTyping 
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId && onlineUsers.has(socket.userId)) {
        onlineUsers.get(socket.userId)!.delete(socket.id);
        
        if (onlineUsers.get(socket.userId)!.size === 0) {
          onlineUsers.delete(socket.userId);
        }
      }
      
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('socket disconnected', socket.id);
    });
  });
};

export { onlineUsers };