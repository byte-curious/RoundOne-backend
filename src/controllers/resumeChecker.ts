import type { Request, Response } from "express"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import { buildStrictResumePrompt } from "../utils/prompts/atsChecker.prompt.js"
import { callGemini } from "../services/gemini.service.js";


export const atsResumeChecker = async (req: Request, res: Response) => {
    try {
        const file = req.file
        const { targetRole, experienceLevel } = req.body || {};

        if (!file) {
            return res.status(400).json({ "error": "Resume file is required" })
        };
        const parser = new PDFParse({ data: file.buffer });
        const pdfData = await parser.getText();
        const extractedText = pdfData.text.trim();
        await parser.destroy() // clean up 

        if (extractedText.length < 50) {
            return res.status(400).json({ error: "Upload valid file" });
        };

        const resumeCheckerPrompt = buildStrictResumePrompt({ resumeText: extractedText, targetRole, experienceLevel });
        const resumeChecker = await callGemini(resumeCheckerPrompt);

        if (!resumeChecker) {
            return res.status(500).json({ error: "AI service not available" })
        };

        const resumeCheckerResult = JSON.parse(resumeChecker.replace(/```json|```/g, "").trim());

        return res.status(200).json({ atsResult: resumeCheckerResult });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ "error": "Internal Server Error" });
    }
}
