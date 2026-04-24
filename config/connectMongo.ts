import mongoose from 'mongoose';

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
