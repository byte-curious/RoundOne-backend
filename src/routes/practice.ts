import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getAllQuestions, getQuestionBySlug, getQuestionSubmissions, getUserSubmissions } from "../controllers/practice.js";
import { submitCode } from "../controllers/practice.js"; 
import {getAvailableCompanies, getDSARoundQuestions, getDSARoundReview, submitDSARoundSession, getDSARoundSession} from "../controllers/dsaRoundSession.js"

const practiceRouter = Router();

practiceRouter.get("/questions", auth, getAllQuestions);
practiceRouter.get("/questions/:slug", auth, getQuestionBySlug);
practiceRouter.get("/submissions", auth, getUserSubmissions);
practiceRouter.get("/:questionId/submissions", auth, getQuestionSubmissions);
practiceRouter.post("/submit", auth, submitCode); 

practiceRouter.post("/dsa-mock-interview", auth, getDSARoundQuestions);
practiceRouter.get("/get-available-companies", auth, getAvailableCompanies);
practiceRouter.get("/review/:sessionId", auth, getDSARoundReview);
practiceRouter.get("/dsa-mock-interview/session/:sessionId", auth, getDSARoundSession);
practiceRouter.post("/dsa-mock-interview/submit", auth, submitDSARoundSession);
export { practiceRouter };
