import mongoose from 'mongoose';

const convSchema = new mongoose.Schema({
  name: String, // optional for group
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

export default mongoose.model('Conversation', convSchema);