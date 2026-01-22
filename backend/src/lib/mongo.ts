import mongoose from "mongoose";

export const connectMongo = async () => {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017/shop_db";
  await mongoose.connect(url);
};

export { mongoose };
