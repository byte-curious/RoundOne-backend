import {evaluateInterview, startInterview} from "../controllers/interview.js"
import { Router } from "express";
import {auth} from "../middleware/auth.middleware.js"

const interviewRouter = Router();
interviewRouter.post("/start", auth, startInterview);
interviewRouter.post("/evaluate", auth, evaluateInterview);

export {interviewRouter}