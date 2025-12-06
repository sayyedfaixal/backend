import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { SERVER_RUNNING_PORT } from "./constants.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    const server = app.listen(SERVER_RUNNING_PORT, () => {
      console.log(`Server is running at PORT : ${SERVER_RUNNING_PORT}`);
      console.log(`Protocol: HTTP (not HTTPS)`);
      console.log(
        `Access the server at: http://localhost:${SERVER_RUNNING_PORT}`
      );
      console.log(
        `Try the register endpoint: http://localhost:${SERVER_RUNNING_PORT}/api/v1/users/register`
      );
    });

    // Add error handling for the server
    server.on("error", (error) => {
      console.error("Server error:", error.message);
    });
  })
  .catch((error) => {
    console.error(`MongoDB connection Failed !!! \n ${error}`);
  });
