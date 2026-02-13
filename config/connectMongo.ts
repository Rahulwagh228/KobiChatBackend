
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


let isconnected = false;

export const connectMongo = async () => {
  try{
    if(isconnected) {
      return mongoose;
  }
  const mongoUri = process.env.MONGO_URI ;
  if(!mongoUri){
    console.error("MONGO_URI not defined in environment variables");
    return null;
  }
  
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
  isconnected = true;
  return mongoose;
  }
  catch(err){
    console.error("MongoDB connection error:", err);
    return null;
  }
};

// let mongoConnection = connectMongo().catch(err => {
//   console.error("Failed to connect to MongoDB:", err);
//   return null;
// });

export default connectMongo;



// mongoose.connect(process.env.MONGO_URI || '').then(() => {
//   const port = process.env.PORT || 4000;
//   server.listen(port, () => console.log('Server listening on', port));
// }).catch((err) => console.error('Mongo connect failed +', err));
