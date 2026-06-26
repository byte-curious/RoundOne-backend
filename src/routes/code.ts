import { executeCode } from "../controllers/code";
import { Router } from "express";
import {auth} from "../middleware/auth.middleware.js"

const codeRouter = Router();

codeRouter.post("/run", auth, executeCode)


export   {codeRouter};
