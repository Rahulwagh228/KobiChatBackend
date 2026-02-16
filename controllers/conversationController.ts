import express from "express";
import Conversation from "../models/conversation";
import User from "../models/User";
import Message from "../models/Message";

// Get all users the current user has conversations with
export const getAllConversationPeople = async (
  req: any,
  res: express.Response,
) => {
  try {
    const userId = req.userId;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    }).populate("participants", "id username email avatarImage");

    // Extract unique users (excluding current user) from all conversations
    const uniqueUsers = new Map();

    conversations.forEach((conv: any) => {
      conv.participants.forEach((participant: any) => {
        if (participant._id.toString() !== userId) {
          uniqueUsers.set(participant._id.toString(), {
            id: participant._id,
            username: participant.username,
            email: participant.email,
            avatarImage: participant.avatarImage,
          });
        }
      });
    });

    const peopleList = Array.from(uniqueUsers.values());

    res.json({
      success: true,
      count: peopleList.length,
      people: peopleList,
    });
  } catch (err: any) {
    console.error("Error fetching conversation people:", err);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: err.message });
  }
};

// Get all conversations for user
export const getUserConversations = async (req: any, res: express.Response) => {
  try {
    const userId = req.userId;

    // console.log("Fetching conversations for user:", userId);

    let conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username avatarImage")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 });

    // Filter out current user from participants
    conversations = conversations.map((conv: any) => {
      const conversationObj = conv.toObject();
      conversationObj.participants = conversationObj.participants.filter(
        (participant: any) => participant._id.toString() !== userId,
      );
      return conversationObj;
    });

    res.json({
      success: true,
      conversations,
    });
  } catch (err: any) {
    console.error("Error fetching conversations:", err);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: err.message });
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (
  req: any,
  res: express.Response,
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Check if user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, msg: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === userId,
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, msg: "Unauthorized access" });
    }

    const messages = await Message.find({
      conversationId,
    })
      .populate("sender", "username avatarImage")
      .sort({ createdAt: -1 });

    // Optimize response: exclude conversationId and flatten sender to just username
    const optimizedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      sender: msg.sender.username,
      senderId: msg.sender._id,
      content: msg.content,
      readBy: msg.readBy,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    res.json({
      success: true,
      conversationId,
      messages: optimizedMessages,
    });
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: err.message });
  }
};

// Create a new conversation
export const createConversation = async (req: any, res: express.Response) => {
  try {
    const { ParticipantEmailOrName } = req.body;
    const userId = req.userId;
    console.log("Creating conversation with:", ParticipantEmailOrName);

    // Validate input
    if (!ParticipantEmailOrName) {
      return res.status(400).json({
        success: false,
        msg: "ParticipantEmailOrName is required",
      });
    }

    // Determine if input is email or username
    let secondUser;

    if (ParticipantEmailOrName.includes("@")) {
      // It's an email - find user by email
      secondUser = await User.findOne({ email: ParticipantEmailOrName });
      if (!secondUser) {
        return res.status(404).json({
          success: false,
          msg: "User with this email not found",
        });
      }
    } else {
      // It's a username - find user by username
      secondUser = await User.findOne({ username: ParticipantEmailOrName });
      if (!secondUser) {
        return res.status(404).json({
          success: false,
          msg: "User with this username not found",
        });
      }
    }

    const secondUserId = secondUser._id.toString();

    // Validate that the second user is not the current user
    if (secondUserId === userId) {
      return res.status(400).json({
        success: false,
        msg: "Cannot create conversation with yourself",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, secondUserId], $size: 2 },
    });

    if (!conversation) {
      conversation = await new Conversation({
        participants: [userId, secondUserId],
      }).save();
    }

    await conversation.populate("participants", "username email avatarImage");

    // Filter out current user from participants
    const conversationObj = conversation.toObject();
    conversationObj.participants = conversationObj.participants.filter(
      (participant: any) => participant._id.toString() !== userId,
    );

    res.json({
      success: true,
      conversation: conversationObj,
    });
  } catch (err: any) {
    console.error("Error creating conversation:", err);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: err.message });
  }
};

// Insert message into collection (called after 30s debounce from client)
export const insertMessage = async (req: any, res: express.Response) => {
  try {
    const { conversationId, content, timestamp } = req.body;
    const userId = req.userId;

    // Validate input
    if (!conversationId || !content || !timestamp) {
      return res.status(400).json({
        success: false,
        msg: "conversationId, content, and timestamp are required",
      });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        msg: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p: any) => p.toString() === userId,
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized access",
      });
    }

    // Create and save message
    const message = await new Message({
      conversationId,
      sender: userId,
      content,
      createdAt: new Date(timestamp),
    }).save();

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    res.json({
      success: true,
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        sender: message.sender,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Error inserting message:", err);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: err.message });
  }
};


