import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from "./routes/auth"
import conversationRoutes from "./routes/conversation"
import connectMongo from './config/connectMongo';

// import authRoutes from './routes/auth';
import { handleSocketConnection } from "./socket/socketHandlers";

const app = express();
const allowedOrigins = [
  'https://kobi-chat.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Initialize socket handlers
handleSocketConnection(io);

connectMongo().then(() => {
  const port = Number(process.env.PORT) || 4000;

  server.listen(port, "0.0.0.0", () => {
    console.log("Server listening on", port);
  });

}).catch((err) => console.error('Mongo connect failed +', err));

// mongoose.connect(process.env.MONGO_URI || '').then(() => {
//   const port = process.env.PORT || 4000;
//   server.listen(port, () => console.log('Server listening on', port));
// }).catch((err) => console.error('Mongo connect failed +', err));
