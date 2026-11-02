import type { Request, Response } from "express";
import { executeNative } from "../services/nativeRunner.js";
import { callGemini } from "../services/gemini.service.js";
import { 
  submissionCodeFeedbackPromptForAC, 
  submissionCodeFeedbackPromptForNotAC 
} from "../utils/prompts/SubmissionCodeFeedback.js";
import { SubmitCodeSchema } from "../zod/index.js";
import { prisma } from "../utils/database/db.js";

export const getAllQuestions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const page = Number(req.query?.page) || 1;
        const limit = Number(req.query?.limit) || 20;
        const company = req.query.company as string || undefined;
        const difficulty = req.query.difficulty as string || undefined;
        const topic = req.query.topic as string || undefined;
        const search = req.query.search as string || undefined;
        const status = req.query.status as string || undefined;

        const whereClause: any = {};
        
        if (difficulty) whereClause.difficulty = difficulty.toUpperCase();
        if (company) whereClause.companies = { has: company };
        if (topic) whereClause.topics = { has: topic };
        if (search) whereClause.title = { contains: search, mode: "insensitive" };

        if (status && userId) {
            if (status === "SOLVED") {
                whereClause.submission = { some: { userId, verdict: "AC" } };
            } else if (status === "UNSOLVED") {
                whereClause.submission = { none: { userId } };
            } else if (status === "ATTEMPTED") {
                whereClause.submission = { 
                    some: { userId },
                    none: { userId, verdict: "AC" } 
                };
            }
        }

        const skip = (page - 1) * limit;
        
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where: whereClause,
                take: limit,
                skip,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    difficulty: true,
                    topics: true,
                    companies: true,
                    createdAt: true,
                    ...(userId && {
                        submission: {
                            where: { userId },
                            select: { verdict: true }
                        }
                    })
                }
            }),
            prisma.question.count({ where: whereClause })
        ]);

        return res.status(200).json({
            success: true,
            data: questions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getQuestionBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        if (!slug) return res.status(400).json({ error: "Slug is required" });

        const question = await prisma.question.findUnique({
            where: { slug: slug.toString() },
            include: {
                testCases: { where: { isHidden: false } }
            }
        });

        if (!question) return res.status(404).json({ error: "Question Not Found" });

        return res.status(200).json({ success: true, data: question });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const submitCode = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;  
        if (!userId) return res.status(401).json({ error: "Unauthorized. Please log in." });

        const response = SubmitCodeSchema.safeParse(req.body);
        if (!response.success) {
            return res.status(400).json({ error: "Enter Valid Inputs", details: response.error.issues }); 
        }

        const { code, language, questionId, userApproach } = response.data;

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { testCases: true }
        });

        if (!question || question.testCases.length === 0) {
            return res.status(404).json({ error: "Question not found or has no test cases" });
        }

        let finalVerdict: "AC" | "WA" | "TLE" | "RTE" | "CE" = "AC";
        let failedAtTestCase = 0;

        for (let i = 0; i < question.testCases.length; i++) {
            const tc = question.testCases[i] as any;
            const result = await executeNative(language, code, tc.input);

            if (result.timedOut) {
                finalVerdict = "TLE";
                failedAtTestCase = i + 1;
                break;
            }
            if (result.exitCode !== 0) {
                finalVerdict = result.stderr.toLowerCase().includes("compilation") ? "CE" : "RTE";
                failedAtTestCase = i + 1;
                break;
            }
            if (result.stdout.trim() !== tc.expectedOutput.trim()) {
                finalVerdict = "WA";
                failedAtTestCase = i + 1;
                break;
            }
        }

        const savedSubmission = await prisma.submission.create({
            data: {
                userId,
                questionId,
                code,
                language,
                userApproach: userApproach ?? null,
                verdict: finalVerdict
            }
        });

        // Background AI feedback
        (async () => {
            try {
                const prompt = finalVerdict === "AC"
                    ? submissionCodeFeedbackPromptForAC({ question, code, language, userApproach: userApproach || "" })
                    : submissionCodeFeedbackPromptForNotAC({ question, language, verdict: finalVerdict, code, userApproach: userApproach || "" });
                
                const aiRaw = await callGemini(prompt);
                if (aiRaw) {
                    const parsed = JSON.parse(aiRaw.replace(/```json|```/g, "").trim());
                    await prisma.submission.update({
                        where: { id: savedSubmission.id },
                        data: {
                            timeComplexity: parsed.timeComplexity,
                            spaceComplexity: parsed.spaceComplexity,
                            aiFeedback: parsed.aiFeedback
                        }
                    });
                }
            } catch (aiErr) {
                console.error("Async AI feedback error:", aiErr);
            }
        })();

        return res.status(200).json({
            success: true,
            submissionId: savedSubmission.id,
            verdict: finalVerdict,
            passed: finalVerdict === "AC",
            failedAt: finalVerdict === "AC" ? null : failedAtTestCase
        });

    } catch (error) {
        console.error("Submission Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUserSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const submissions = await prisma.submission.findMany({
            where: { userId },
            select: {
                id: true,
                verdict: true,
                createdAt: true,
                question: { select: { title: true, difficulty: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getQuestionSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { questionId } = req.params;
        
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (!questionId) return res.status(400).json({ error: "QuestionId is required" });

        const submissions = await prisma.submission.findMany({
            where: { userId, questionId: questionId.toString() },
            orderBy: { createdAt: "desc" }
        });

        return res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
