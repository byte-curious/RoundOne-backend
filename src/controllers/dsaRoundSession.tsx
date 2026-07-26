import type { Request, Response } from "express"
import { prisma } from "../utils/database/db.js";

function pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) {
        throw new Error("Cannot pick from an empty array");
    }
    return arr[Math.floor(Math.random() * arr.length)] as T;
}

const getDSARoundQuestions = async (req: Request, res: Response) => {
    try {
        const { company } = req.body;  
        const userId = req.user?.id;
        
        if (!company) {
            return res.status(400).json({ error: "Provide The Company Name" });
        }
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const allCompanyQuestions = await prisma.question.findMany({
            where: {
                companies: {
                    has: company  
                }
            },
            include: {
                testCases: true 
            }
        });
        const easyQs = allCompanyQuestions.filter(q => q.difficulty === "EASY");
        const mediumQs = allCompanyQuestions.filter(q => q.difficulty === "MEDIUM");
        const hardQs = allCompanyQuestions.filter(q => q.difficulty === "HARD");
        // what if there is not enough questions
        if (easyQs.length === 0 || mediumQs.length === 0 || hardQs.length === 0) {
            return res.status(400).json({ error: `Not enough questions to generate a full Mock OA for ${company}.` });
        }
        const easyQuestion = pickRandom(easyQs);
        const mediumQuestion = pickRandom(mediumQs);
        const hardQuestion = pickRandom(hardQs);
        const session = await prisma.dSARoundSession.create({
            data: {
                userId: userId,
                company: company,
                questions: {
                    connect: [
                        { id: easyQuestion.id },
                        { id: mediumQuestion.id },
                        { id: hardQuestion.id }
                    ]
                }
            }
        });
        //   ANTI-CHEAT: Remove hidden test cases before sending to frontend, only send them the visial ones
        const sanitizedQuestions = [easyQuestion, mediumQuestion, hardQuestion].map(q => {
            return {
                ...q,
                testCases: q.testCases.filter(tc => tc.isHidden === false)  
            }
        });
        return res.status(200).json({
            message: "DSA Round Generated successfully",
            sessionId: session.id,
            questions: sanitizedQuestions
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
export {getDSARoundQuestions}
