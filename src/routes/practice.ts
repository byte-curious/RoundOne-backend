import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getAllQuestions, getQuestionBySlug } from "../controllers/practice.js";
import { submitCode } from "../controllers/practice.js"; // The one we just wrote!

const practiceRouter = Router();

practiceRouter.get("/questions", getAllQuestions);
practiceRouter.get("/questions/:slug", getQuestionBySlug);

// Requires auth because we need req.user.id for the Submission table
practiceRouter.post("/submit", auth, submitCode); 

export { practiceRouter };
