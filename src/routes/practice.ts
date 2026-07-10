import { Router } from "express";
import {auth} from "../middleware/auth.middleware.js"
import { getAllQuestions,getQuestionBySlug } from "../controllers/practice.js";

const practiceRouter = Router();

practiceRouter.get("/", auth, getAllQuestions)
practiceRouter.get("/:slug", auth, getQuestionBySlug)


export   {practiceRouter};
