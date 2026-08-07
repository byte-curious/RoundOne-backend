import "dotenv/config.js"
import express from "express"
import cors from "cors"
import { userRouter } from "./routes/user.js"
import cookieParser from "cookie-parser";
import { resumeRouter } from "./routes/resume.js"
import { interviewRouter } from "./routes/interview.js";
import { codeRouter } from "./routes/code.js"
import "./worker/execution.js"
import "./worker/ai.js";
import { progressRouter } from "./routes/progress.js"
import { practiceRouter } from "./routes/practice.js";
import {analyticsRouter} from "./routes/analytics.js";

const app = express()
const PORT = process.env.PORT || 3000
const allowedOrigins = [
    "http://localhost:5173",        
    "https://roundoneprep.me",
    "https://www.roundoneprep.me"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));


// express.json is used to parse the requesting body
app.use(cookieParser());
app.use(express.json());


app.get("/", (req, res) => {
    return res.json({
        message: "hollaaaaaaa..."
    })
});

app.use("/user", userRouter);
app.use("/resume", resumeRouter)
app.use("/interview", interviewRouter)
app.use("/code", codeRouter)
app.use("/progress", progressRouter);
app.use("/practice", practiceRouter);
app.use("/analytics", analyticsRouter);

app.listen(PORT, () => console.log("server is running", PORT))
