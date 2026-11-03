import type { Request, Response } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { TTSRequestSchema } from "../zod/index.js";

let sharedTTS : MsEdgeTTS| null = null;

async function getTTSInstance(voice = "en-IN-NeerjaNeural") {
  if (!sharedTTS) {
    sharedTTS = new MsEdgeTTS();
    await sharedTTS.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  }
  return sharedTTS;
}

export const generateTTS = async (req: Request, res: Response): Promise<any> => {
  try {
    const { text, pitch, rate, voice } = req.body;
    const response = await TTSRequestSchema.safeParseAsync({ text, pitch, rate, voice });

    if (!response.success) {
      return res.status(400).json({ error: response.error.issues });
    }

    const tts = await getTTSInstance(voice);

    // 1. Generate audio stream
    const rawResult: any = await tts.toStream(response.data.text);

    console.log("TTS RAW RESULT TYPE:", typeof rawResult, rawResult?.constructor?.name);
    console.log("TTS RAW RESULT KEYS:", Object.keys(rawResult || {}));

    // Find the stream or buffer target
    const target = rawResult?.audioStream 
                || rawResult?.stream 
                || rawResult?.data 
                || rawResult?.readable 
                || rawResult;

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    // Case 1: Binary Buffer / Uint8Array
    if (Buffer.isBuffer(target) || target instanceof Uint8Array) {
      return res.send(Buffer.from(target));
    }

    // Case 2: Classic Pipeable Stream
    if (typeof target.pipe === "function") {
      target.on("error", (err: any) => console.error("Pipe error:", err));
      return target.pipe(res);
    }

    // Case 3: EventEmitter Stream (.on('data'))
    if (typeof target.on === "function") {
      target.on("data", (chunk: any) => {
        res.write(chunk);
      });
      target.on("end", () => {
        res.end();
      });
      target.on("close", () => {
        res.end();
      });
      target.on("error", (err: any) => {
        console.error("EventEmitter error:", err);
        if (!res.headersSent) res.status(500).json({ error: "TTS Audio error" });
      });
      return;
    }

    // Case 4: Web Streams Reader (getReader)
    if (typeof target.getReader === "function") {
      const reader = target.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    }

    // Case 5: Async Iterable (for await)
    if (Symbol.asyncIterator in Object(target)) {
      for await (const chunk of target) {
        res.write(chunk);
      }
      return res.end();
    }

    console.error("Could not find suitable consumer for target:", target);
    if (!res.headersSent) {
      return res.status(500).json({ error: "TTS Stream format error" });
    }

  } catch (error) {
    console.error("TTS Generation Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }
  }
};
