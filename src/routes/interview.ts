import {evaluateInterview, startInterview, saveInterviewSession, getInterviewHistory, getPublicReport} from "../controllers/interview.js"
import { Router } from "express";
import {transcribeAudio, upload} from "../controllers/transcribe.js"
import {auth} from "../middleware/auth.middleware.js"
import {generateTTS} from "../controllers/tts.js";

const interviewRouter = Router();
interviewRouter.post("/start", auth, startInterview);
interviewRouter.post("/evaluate", auth, evaluateInterview);
interviewRouter.post("/transcribe", auth,upload.single("audio"), transcribeAudio)
interviewRouter.post("/speak", auth, generateTTS)
interviewRouter.post("/save", auth, saveInterviewSession);
interviewRouter.get("/history", auth, getInterviewHistory);
interviewRouter.get("/report/:id", getPublicReport);

export {interviewRouter}
