import("dotenv/config.js");
import type {Request, Response} from "express"
import multer from "multer"
import OpenAI, { toFile } from "openai"
 
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",  
});

const storage = multer.memoryStorage();
export const upload = multer({storage: storage});

export const transcribeAudio  = async(req: Request, res: Response)=>{
  try {
    const audioFile = req.file!
    if(!audioFile){
      return res.status(400).json({error : "Upload Audio Voice"});
    };
    // openAI sdk require "File" object with name, but multer gives us memory buffer
    // convert memory buffer to "File" object

    const file = await toFile(audioFile.buffer, "audio.webm", {type: audioFile.mimetype});

    // sending nwo this file to qrok
    const transcription  = await groq.audio.transcriptions.create({
      file: file,
      model : 'whisper-large-v3'
    });
    
    return res.status(200).json({transcript : transcription.text});


  } catch (error) {
    console.error(error);
    return res.status(500).json({error: "Failed to transcibe audio"});
  }
}

