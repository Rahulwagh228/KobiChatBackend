import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);