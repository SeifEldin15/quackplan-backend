import mongoose from "mongoose";
export const connectDB = async (uri) => mongoose.connect(uri, {
  dbName: "quackplan",
  serverSelectionTimeoutMS: 3000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10
});