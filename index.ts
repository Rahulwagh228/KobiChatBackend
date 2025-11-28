import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from "./routes/auth"
import conversationRoutes from "./routes/conversation"

// import authRoutes from './routes/auth';
import { handleSocketConnection } from "./socket/socketHandlers";

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // restrict in prod
});

// Initialize socket handlers
handleSocketConnection(io);

mongoose.connect(process.env.MONGO_URI || '').then(() => {
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log('Server listening on', port));
}).catch((err) => console.error('Mongo connect failed +', err));
