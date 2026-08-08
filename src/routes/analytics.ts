import { Router } from "express";
import {getAnalytics, trackVisit}  from "../controllers/analytics.js";

const analyticsRouter = Router();


analyticsRouter.get("/stats", getAnalytics)
analyticsRouter.post("/track", trackVisit);

export   {analyticsRouter};
