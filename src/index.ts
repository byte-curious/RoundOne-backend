import "dotenv/config.js" 
import express from "express"
import cors from "cors"
import {userRouter} from "./routes/user.js"
const app =  express()
const PORT = process.env.PORT || 3000
app.use(cors());
// express.json is used to parse the requesting body
app.use(express.json());

app.get("/", (req, res)=>{
    return res.json({
        message: "hollaaaaaaa..."
    })
})
app.use("/user", userRouter);
app.listen(PORT, ()=> console.log("server is running", PORT))