import "dotenv/config.js" 
import express from "express"
import cors from "cors"
import {userRouter} from "./routes/user.js"
import cookieParser from "cookie-parser";
import {resumeRouter} from "./routes/resume.js"
import {interviewRouter} from "./routes/interview.js";

const app =  express()
const PORT = process.env.PORT || 3000
app.use(cors({
    origin:"https://round-one-frontend.vercel.app",
    credentials: true
}));
// express.json is used to parse the requesting body
app.use(cookieParser());
app.use(express.json());


app.get("/", (req, res)=>{
    return res.json({
        message: "hollaaaaaaa..."
    })
});

app.use("/user", userRouter);
app.use("/resume", resumeRouter)
app.use("/interview", interviewRouter)
app.listen(PORT, ()=> console.log("server is running", PORT))