import express from "express"
import {resendOtp, otpValidation, login, logout, signup, getMe } from "../controllers/user.js"
import { auth } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/verify-otp", otpValidation);
userRouter.post("/resend-otp", resendOtp);
userRouter.post("/login", login);
userRouter.post("/logout", logout)
userRouter.get("/me",auth, getMe);
export {userRouter}
