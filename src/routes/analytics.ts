import { Router } from "express";
import {getAnalytics}  from "../controllers/analytics.js";

const analyticsRouter = Router();


analyticsRouter.get("/stats", getAnalytics)

export   {analyticsRouter};
