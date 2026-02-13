import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "GOBI"

// Register
router.post('/register', async(req: express.Request, res: express.Response) =>{
    try{
        const {username, email, password} = req.body;
        if(!username || !email || !password) return res.status(400).json({msg: "All fields are required"});

        const existingUser = await User.findOne({$or: [{email}, {username}]});
        if(existingUser) return res.status(400).json({msg:"user already exist"});

        const hashed = await bcrypt.hash(password, 10);
        const user = await new User({username, email, password:hashed}).save();
        const token = jwt.sign({id:user._id}, JWT_SECRET, {expiresIn:"7d"});
        res.json({token, user:{id:user._id, username:user.username, email:user.email}});
        
        }catch(err){
            console.error(err);
            res.status(500).json({msg:"Server error"});
        } 
    })



// Login
router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) return res.status(400).json({ msg: 'Invalid credentialsss' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

export default router;