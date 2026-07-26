import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getAllQuestions, getQuestionBySlug, getQuestionSubmissions, getUserSubmissions } from "../controllers/practice.js";
import { submitCode } from "../controllers/practice.js"; 
import {getDSARoundQuestions} from "../controllers/dsaRoundSession.js"
const practiceRouter = Router();

practiceRouter.get("/questions",auth,  getAllQuestions);
practiceRouter.get("/questions/:slug",auth, getQuestionBySlug);
practiceRouter.get("/submissions", auth, getUserSubmissions)
practiceRouter.get("/:questionId/submissions", auth, getQuestionSubmissions);
practiceRouter.post("/submit", auth, submitCode); 
practiceRouter.get("/dsa-mock-interviewe", auth, getDSARoundQuestions);
export { practiceRouter };
