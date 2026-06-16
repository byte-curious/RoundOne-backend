import express from "express"
import {otpValdation, login, logout, signup } from "../controllers/user.js"

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/verify-otp", otpValdation);
userRouter.post("/login", login);
userRouter.get("/logout", logout)

export {userRouter}