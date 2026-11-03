import type { Request, Response } from "express";
import { Readable } from "node:stream";
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
    await tts.setMetadata(
      voice || "en-IN-NeerjaNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const rawStream: any = tts.toStream(response.data.text);

    // Convert WebStream to Node.js Readable stream
    let nodeStream: Readable;
    if (typeof rawStream.pipe === "function") {
      nodeStream = rawStream;
    } else if (typeof rawStream.getReader === "function") {
      nodeStream = Readable.fromWeb(rawStream);
    } else if (rawStream && typeof rawStream.readable?.getReader === "function") {
      nodeStream = Readable.fromWeb(rawStream.readable);
    } else {
      nodeStream = Readable.from(rawStream);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    nodeStream.on("error", (err) => {
      console.error("Audio stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "TTS streaming error" });
      }
    });

    nodeStream.pipe(res);
  } catch (error) {
    console.error("TTS Generation Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }
  }
};
