import type { Request, Response } from "express";
import { prisma } from "../utils/database/db.js";
import { executeNative } from "../services/nativeRunner.js";

function pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("Cannot pick from an empty array");
    return arr[Math.floor(Math.random() * arr.length)] as T;
}

const getDSARoundQuestions = async (req: Request, res: Response) => {
    try {
        const { company } = req.body;
        const userId = req.user?.id;

        if (!company) return res.status(400).json({ error: "Provide The Company Name" });
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const allCompanyQuestions = await prisma.question.findMany({
            where: { companies: { has: company } },
            include: { testCases: true }
        });
        const easyQs = allCompanyQuestions.filter(q => q.difficulty === "EASY");
        const mediumQs = allCompanyQuestions.filter(q => q.difficulty === "MEDIUM");
        const hardQs = allCompanyQuestions.filter(q => q.difficulty === "HARD");

        if (easyQs.length === 0 || mediumQs.length === 0 || hardQs.length === 0) {
            return res.status(400).json({ error: `Not enough questions to generate a full Mock OA for ${company}.` });
        }

        const easyQuestion = pickRandom(easyQs);
        const mediumQuestion = pickRandom(mediumQs);
        const hardQuestion = pickRandom(hardQs);

        const session = await prisma.dSARoundSession.create({
            data: {
                userId,
                company,
                questions: {
                    connect: [
                        { id: easyQuestion.id },
                        { id: mediumQuestion.id },
                        { id: hardQuestion.id }
                    ]
                }
            }
        });

        const sanitizedQuestions = [easyQuestion, mediumQuestion, hardQuestion].map(q => ({
            ...q,
            testCases: q.testCases.filter(tc => !tc.isHidden)
        }));

        return res.status(200).json({
            message: "DSA Round Generated successfully",
            sessionId: session.id,
            questions: sanitizedQuestions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getAvailableCompanies = async (req: Request, res: Response) => {
    try {
        const questions = await prisma.question.findMany({ select: { companies: true } });
        const allCompanies = questions.flatMap(q => q.companies);
        const uniqueCompanies = [...new Set(allCompanies)].sort();
        return res.status(200).json({ companies: uniqueCompanies });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getDSARoundSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) return res.status(400).json({ error: "SessionId is required" });

        const session = await prisma.dSARoundSession.findUnique({
            where: { id: sessionId.toString() },
            include: { questions: { include: { testCases: true } } }
        });
        if (!session) return res.status(404).json({ error: "Session Not Found" });

        const sanitized = session.questions.map(q => ({
            ...q,
            testCases: q.testCases.filter(t => !t.isHidden)
        }));

        return res.status(200).json({ success: true, questions: sanitized });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const submitDSARoundSession = async (req: Request, res: Response) => {
    try {
        const { sessionId, submissions } = req.body;
        const userId = req.user?.id;

        if (!sessionId || !submissions || !userId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const session = await prisma.dSARoundSession.findUnique({ where: { id: sessionId } });
        if (!session) return res.status(404).json({ error: "Session not found" });
        if (session.status === "COMPLETED") return res.status(400).json({ error: "Already submitted" });

        let totalScore = 0;

        for (const sub of submissions) {
            const question = await prisma.question.findUnique({
                where: { id: sub.questionId },
                include: { testCases: true }
            });

            if (!question) continue;

            let finalVerdict: "AC" | "WA" | "TLE" | "RTE" | "CE" = "AC";

            if (!sub.code || sub.code.trim() === "") {
                finalVerdict = "WA";
            } else {
                for (const tc of question.testCases) {
                    const result = await executeNative(sub.language, sub.code, tc.input);
                    if (result.timedOut) { finalVerdict = "TLE"; break; }
                    if (result.exitCode !== 0) { 
                        finalVerdict = result.stderr.toLowerCase().includes("compilation") ? "CE" : "RTE"; 
                        break; 
                    }
                    if (result.stdout.trim() !== tc.expectedOutput.trim()) { 
                        finalVerdict = "WA"; 
                        break; 
                    }
                }
            }

            if (finalVerdict === "AC") totalScore += 1;

            await prisma.submission.create({
                data: {
                    userId,
                    questionId: sub.questionId,
                    dSARoundSessionId: sessionId,
                    code: sub.code,
                    language: sub.language,
                    verdict: finalVerdict,
                    aiFeedback: "Completed"
                }
            });
        }

        await prisma.dSARoundSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                score: totalScore
            }
        });

        return res.status(200).json({ message: "Assessment graded successfully", score: totalScore });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getDSARoundReview = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        if (!sessionId) return res.status(400).json({ error: "SessionId is required" });
        if (!userId) return res.status(403).json({ error: "Unauthorized User" });

        const session = await prisma.dSARoundSession.findUnique({
            where: { id: sessionId.toString() },
            include: { submissions: true, questions: true }
        });
        if (!session) return res.status(404).json({ error: "Session Not Found" });
        if (session.userId !== userId) return res.status(403).json({ error: "Unauthorized User" });

        return res.status(200).json({ success: true, session });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getDSARoundHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const history = await prisma.dSARoundSession.findMany({
            where: { userId },
            orderBy: { startedAt: "desc" }
        });

        return res.status(200).json({ history });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { 
  getDSARoundHistory, 
  getDSARoundReview, 
  submitDSARoundSession, 
  getDSARoundSession, 
  getDSARoundQuestions, 
  getAvailableCompanies 
};
