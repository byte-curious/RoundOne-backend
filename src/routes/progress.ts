import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getProgress, toggleProgress } from "../controllers/progress.js";

const progressRouter = Router();

progressRouter.get("/:sheetId", auth, getProgress);
progressRouter.post("/toggle", auth, toggleProgress);

export { progressRouter };
