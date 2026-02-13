import express from 'express';
import { authMiddleware } from '../middlewares/auth';
const router = express.Router();
import Message from '../models/Message';
import conversation from '../models/conversation';


router.post('/create', authMiddleware, async(req: express.Request, res: express.Response) =>{
    const {participantIds, name} = req.body;

    let conv;
    if(participantIds.length === 2){
        conv = await conversation.findOne({participants:{$all: participantIds, $size:2}});
    }
    if(!conv) conv = await new conversation({participants: participantIds, name}).save();
    res.json(conv);
});



// Get conversations for user
router.get('/', authMiddleware, async(req: any, res: express.Response) =>{
    //  if (!req.userId) {
    //     return res.status(400).json({ error: "User ID missing" });
    //   }
    // const userId : any = req.userId as any;
    const convs = await conversation.find({participants: req.UserId}).populate('participants', 'username')
    .populate({path:'lastmessage', populate:{path:'sender', select:'username'}}).sort({updatedAt: -1});

    res.json(convs);
})


// get messages for conversation
router.get('/:id/messages', authMiddleware, async(req: express.Request, res: express.Response) =>{
    const messages = await Message.find({conversation: req.params.id}).populate('sender', 'username').sort({createdAt: -1});
    res.json(messages);
})

export default router;