// import { executeCode } from "../controllers/code.js";
import {execution} from "../controllers/execute.js"
import { Router } from "express";
import {auth} from "../middleware/auth.middleware.js"
import {getResult} from "../controllers/result.js"
const codeRouter = Router();

codeRouter.post("/execute", auth, execution)
codeRouter.get("/result/:id", auth, getResult)

export   {codeRouter};
