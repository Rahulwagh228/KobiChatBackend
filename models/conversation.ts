import mongoose from "mongoose";

const convSchema = new mongoose.Schema(
  {
    name: String, // optional for group
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: function (v: any) {
          return v.length === 2;
        },
        message: "Participants must contain exactly 2 users",
      },
      required: true,
    },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true },
);

export default mongoose.model("Conversation", convSchema);
