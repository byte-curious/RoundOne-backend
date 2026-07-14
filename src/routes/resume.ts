import {Router} from "express"

import {uploadResume} from "../controllers/resume.js"
import {auth} from "../middleware/auth.middleware.js"
import {memUpload} from "../middleware/upload.middleware.js"
import {atsResumeChecker, enhanceBullets, trackDownload}  from "../controllers/resumeChecker.js"

const resumeRouter = Router();

resumeRouter.post("/upload", auth, memUpload.single("resume"), uploadResume)
resumeRouter.post("/ats-check", auth, memUpload.single("resume"),atsResumeChecker);
resumeRouter.post("/enhance-bullets", auth, enhanceBullets)
resumeRouter.post("/track-download", auth, trackDownload)
export {resumeRouter}
