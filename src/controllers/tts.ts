import type { Request, Response } from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import crypto from "crypto";
import { TTSRequestSchema } from "../zod/index.js"

const execPromise = promisify(exec); // this is done so that we can do async/await instead of callbacks

export const generateTTS = async (req: Request, res: Response): Promise<any> => {
    try {
        // validate zod 
        const { text, pitch, rate, voice } = req.body;
        const response = await TTSRequestSchema.safeParseAsync({ text, pitch, rate, voice });
        if (!response.success) {
            return res.status(400).json({ error: response.error.issues });
        };

        // creating unique temp file for all users
        const fileId = crypto.randomUUID();
        const textFilePath = path.join(os.tmpdir(), `${fileId}`);
        const audioFilePath = path.join(os.tmpdir(), `${fileId}`);

        // write text to file
        // we do this to prevent project from command injection
        fs.writeFileSync(textFilePath, response.data.text);

        const command = `python3 -m edge_tts --voice "${voice}" --rate="${rate}" --pitch="${pitch}" -f "${textFilePath}" --write-media "${audioFilePath}"`;
        
        await execPromise(command);

        // read the generated audio file
        const audioBytes = fs.readFileSync(audioFilePath);

        // cleanup -> isliye kar rhe ki audio files server pe n rahe kyuki ae space full kar dega
        fs.unlinkSync(textFilePath);
        fs.unlinkSync(audioFilePath);

        // send the raw audi bytes back to frontend
        res.setHeader("Content-type", "audio/mpeg");
        return res.status(200).send(audioBytes);
    } catch (error) {
        console.error("TTS Generation Error:", error);
        return res.status(500).json({ error: "Failed to generate audio" });
    }
}
