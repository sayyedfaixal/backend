import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionResponse = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MONGODB CONNECTED !!!!`);
    console.log(`DB HOST : ${connectionResponse.connection.host}`);
  } catch (error) {
    console.error("CONNECTION FAILED !!!");
    console.error(`ERROR CONNECTING MONGODB : ${error}`);
    process.exit(1);
  }
};

export default connectDB;
