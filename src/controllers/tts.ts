import type { Request, Response } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { TTSRequestSchema } from "../zod/index.js";

export const generateTTS = async (req: Request, res: Response): Promise<any> => {
  try {
    const { text, pitch, rate, voice } = req.body;
    const response = await TTSRequestSchema.safeParseAsync({ text, pitch, rate, voice });

    if (!response.success) {
      return res.status(400).json({ error: response.error.issues });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice || "en-IN-NeerjaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const readableStream = tts.toStream(response.data.text) as any;
    res.setHeader("Content-Type", "audio/mpeg");
    readableStream.pipe(res);
  } catch (error) {
    console.error("TTS Generation Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }
  }
};
