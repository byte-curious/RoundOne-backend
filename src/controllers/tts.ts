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
    await tts.setMetadata(
      voice || "en-IN-NeerjaNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    // 1. Await the stream generation
    let rawResult: any = await tts.toStream(response.data.text);

    // Extract stream if wrapped inside an object
    const stream = rawResult?.stream || rawResult?.readable || rawResult;

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");

    // 2. Case A: Web Streams API (getReader)
    if (stream && typeof stream.getReader === "function") {
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
      return;
    }

    // 3. Case B: Classic Node Stream (pipe)
    if (stream && typeof stream.pipe === "function") {
      stream.on("error", (err: any) => {
        console.error("Stream piping error:", err);
        if (!res.headersSent) res.status(500).json({ error: "TTS Stream Error" });
      });
      stream.pipe(res);
      return;
    }

    // 4. Case C: Async Iterable (for await)
    if (stream && Symbol.asyncIterator in Object(stream)) {
      for await (const chunk of stream) {
        res.write(chunk);
      }
      res.end();
      return;
    }

    throw new Error(`Unrecognized stream format: ${typeof stream}`);

  } catch (error) {
    console.error("TTS Generation Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }
  }
};
