import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

console.log("Inside User Register Route");

router.route("/register").post((req, res, next) => {
  console.log("Request received at /register endpoint");
  console.log("Request method:", req.method);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
}, registerUser);

export default router;
