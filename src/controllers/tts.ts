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
    // Declare file paths here so they can be accessed in the 'finally' cleanup block
    let textFilePath = "";
    let audioFilePath = "";

    try {
        // validate zod 
        const { text, pitch, rate, voice } = req.body;
        const response = await TTSRequestSchema.safeParseAsync({ text, pitch, rate, voice });
        if (!response.success) {
            return res.status(400).json({ error: response.error.issues });
        };

        // creating unique temp file for all users
        //  Added .txt and .mp3 extensions so Node knows exactly what to delete
        const fileId = crypto.randomUUID();
        textFilePath = path.join(os.tmpdir(), `${fileId}.txt`);
        audioFilePath = path.join(os.tmpdir(), `${fileId}.mp3`);

        // write text to file
        // we do this to prevent project from command injection
        fs.writeFileSync(textFilePath, response.data.text);

        const edgeTts = "/home/azureuser/edge-tts-env/bin/edge-tts";

        const command = `"${edgeTts}" \
                        --voice "${voice}" \
                        --rate="${rate}" \
                        --pitch="${pitch}" \
                        -f "${textFilePath}" \
                        --write-media "${audioFilePath}"`;
        await execPromise(command);

        // read the generated audio file
        const audioBytes = fs.readFileSync(audioFilePath);

        // send the raw audi bytes back to frontend
        res.setHeader("Content-type", "audio/mpeg");
        res.status(200).send(audioBytes);

    } catch (error) {
        console.error("TTS Generation Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Failed to generate audio" });
        }
    } finally {
        // cleanup -> isliye kar rhe ki audio files server pe n rahe kyuki ae space full kar dega
        // SAFE CLEANUP: fs.existsSync checks if the file exists before deleting, preventing server crashes!
        try {
            if (textFilePath && fs.existsSync(textFilePath)) fs.unlinkSync(textFilePath);
            if (audioFilePath && fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
        } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
        }
    }
}
