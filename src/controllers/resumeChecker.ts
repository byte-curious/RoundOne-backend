import type { Request, Response } from "express"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import { buildStrictResumePrompt } from "../utils/prompts/atsChecker.prompt.js"
import { callGemini } from "../services/gemini.service.js";
import { BulletWriter } from "../zod/index.js";
import {buildBulletPrompt} from "../utils/prompts/bulletWriter.prompt.js";


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
export const enhanceBullets = async (req: Request, res: Response) => {
    try {
        const { techStack, brainDump, userFeedback } = req.body;
        
        const response = BulletWriter.safeParse({ techStack, brainDump, userFeedback });
        
        if(!response.success) {
            return res.status(400).json({ error: "Provide Valid Inputs" });
        }

        const bulletWritePrompt = buildBulletPrompt(
            {techStack: response.data.techStack, 
            brainDump: response.data.brainDump, 
            userFeedback: response.data.userFeedback}
        );
        
        const aiResponse = await callGemini(bulletWritePrompt);

        if(!aiResponse){
            return res.status(500).json({ error : "AI service unavailable" });
        }

        // safe parsing 
        let bulletWriteResult;
        try {
            const cleanedJson = aiResponse.replace(/```json|```/g, "").trim();
            bulletWriteResult = JSON.parse(cleanedJson);
            
            if (!Array.isArray(bulletWriteResult)) {
                throw new Error("AI did not return an array");
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", aiResponse);
            return res.status(500).json({ error: "AI returned an invalid format. Please try again." });
        }

        return res.status(200).json({
            success: true,
            bullets: bulletWriteResult
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
