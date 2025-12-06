import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.route.js";

// routes declaration
/**
 * The reason why we are using app.use() -> Because we have segregated the routes and hence we would need to use middleware, if we would have use everything in
 * one file in that case we would have directly used app.get()
 */
app.use("/api/v1/users", userRouter);
export { app };
