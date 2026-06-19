import {Router} from "express"

import {uploadResume} from "../controllers/resume.js"
import {auth} from "../middleware/auth.middleware.js"
import {memUpload} from "../middleware/upload.middleware.js"

const resumeRouter = Router();

resumeRouter.post("/upload", auth, memUpload.single("resume"), uploadResume)

export {resumeRouter}