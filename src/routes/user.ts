import express from "express"
import { login, logout } from "../controllers/user.js"

const userRouter = express.Router();

userRouter.get("/login", login);
userRouter.get("/logout", logout)

export {userRouter}