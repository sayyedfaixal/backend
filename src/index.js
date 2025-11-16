import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { SERVER_RUNNING_PORT } from "./constants.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(SERVER_RUNNING_PORT, () => {
      console.log(`Server is running at PORT : ${SERVER_RUNNING_PORT}`);
    });
  })
  .catch((error) => {
    console.error(`MongoDB connection Failed !!! \n ${error}`);
  });
