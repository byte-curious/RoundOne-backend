import { type Request, type Response } from "express"
import { prisma } from "../utils/database/db.js";
import { InterviewStart, EvaluateInterview } from "../zod/index.js"
import { buildHRPrompt } from "../utils/prompts/hr.prompt.js";
import { buildDSAPrompt } from "../utils/prompts/dsa.prompt.js";
import { buildTechnicalPrompt } from "../utils/prompts/technical.prompt.js";
import { callGemini } from "../services/gemini.service.js";
import {buildEvaluationPrompt} from "../utils/prompts/evaluate.prompt.js"

const startInterview = async (req: Request, res: Response) => {
    try {
        const { company, role, level, language } = req.body;
        const response = await InterviewStart.safeParseAsync({ company, role, level, language });
        if (!response.success) {
            return res.status(400).json({
                error: "Enter valid Credentials"
            })
        };

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) {
            return res.status(404).json({ error: "User Not Found" })
        }
        const name = user?.name;
        const resume = await prisma.resume.findUnique({ where: { userId: req.user!.id } })
        if (!resume) {
            return res.status(400).json({ error: "Please upload resume first" });
        };
        const extractedText = resume.extractedText;

        // 1. Build prompts
        const hrPrompt = buildHRPrompt({ name, resumeText: extractedText, company, role })
        const technicalPrompt = buildTechnicalPrompt({ name, resumeText: extractedText, company, role })
        const dsaPrompt = buildDSAPrompt({ company, level, language })

        // 2. Call Gemini for each
        const hrRaw = await callGemini(hrPrompt)
        const technicalRaw = await callGemini(technicalPrompt)
        const dsaRaw = await callGemini(dsaPrompt)

        // 3. Null checks
        if (!hrRaw || !technicalRaw || !dsaRaw) {
            return res.status(500).json({ error: "AI service unavailable" })
        }

        // 4. Parse responses
        const hrResult = JSON.parse(hrRaw.replace(/```json|```/g, "").trim())
        const technicalResult = JSON.parse(technicalRaw.replace(/```json|```/g, "").trim())
        const dsaResult = JSON.parse(dsaRaw.replace(/```json|```/g, "").trim())

        // 5. Return
        return res.status(200).json({ hr: hrResult, technical: technicalResult, dsa: dsaResult })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

const evaluateInterview = async(req: Request, res: Response)=>{
    try {
        const {round, question, answer, company, spokenApproach} = req.body;
        const response = await EvaluateInterview.safeParseAsync({round, question, answer, company, spokenApproach});
        if(!response.success){
            return res.status(400).json({error: response.error});
        }

        // build prompt
        const evaluatePrompt = buildEvaluationPrompt({round, question, answer, company, spokenApproach});

        // call gemini
        const evaluateRaw = await callGemini(evaluatePrompt);

        // parsing
        if(!evaluateRaw){
            return  res.status(500).json({ error: "AI service unavailable" })
        }
        const evaluateResult = JSON.parse(evaluateRaw.replace(/```json|```/g, "").trim());
        return res.status(200).json({evaluateResult})
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({error : "Internal Server Error"});
    }
}
const saveInterviewSession = async (req: Request, res: Response) => {
    try {
        const { company, role, level, language, evaluations } = req.body;

        //   validation
        if (!company || !role || !evaluations || evaluations.length === 0) {
            return res.status(400).json({ error: "Missing required session data" });
        }

        // Calculate the total score
        const totalScore = evaluations.reduce((sum: number, ev: any) => sum + ev.score, 0);

        // Creates the Session AND all Evaluations in one transaction!
        const savedSession = await prisma.session.create({
            data: {
                userId: req.user!.id,  
                company,
                role,
                level,
                language,
                totalScore,
                evaluations: {
                    create: evaluations.map((ev: any) => ({
                        round: ev.round,
                        question: ev.question,
                        candidateAnswer: ev.answer || "No answer provided", 
                        score: ev.score,
                        maxScore: ev.maxScore,
                        feedback: ev.feedback,
                        strongPoints: ev.strongPoints,
                        improvements: ev.improvements,
                        suggestion: ev.suggestion
                    }))
                }
            }
        });

        return res.status(201).json({ message: "Session saved successfully", sessionId: savedSession.id });

    } catch (error) {
        console.error("Failed to save session:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const getInterviewHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Fetch all sessions for this user, including their evaluations
        const sessions = await prisma.session.findMany({
            where: { userId },
            include: {
                evaluations: true // We need this to calculate average scores!
            },
            orderBy: {
                createdAt: 'desc' // Newest interviews first
            }
        });

        return res.status(200).json({ sessions });

    } catch (error) {
        console.error("Failed to fetch interview history:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const getPublicReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if(!id){
            return res.status(400).json({error: "id is not present"});
        }
        
        const session = await prisma.session.findUnique({
            where: { id: id.toString() },
            include: {
                evaluations: true,
                user: { select: { name: true } }  
            }
        });

        if (!session) {
            return res.status(404).json({ error: "Report not found" });
        }

        return res.status(200).json({ session });

    } catch (error) {
        console.error("Failed to fetch public report:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export {startInterview, evaluateInterview, saveInterviewSession, getInterviewHistory, getPublicReport}
