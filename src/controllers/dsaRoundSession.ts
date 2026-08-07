import type { Request, Response } from "express"
import { prisma } from "../utils/database/db.js";
import { addArenaSubmissionJob } from "../queue/execute.js";

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
};
const getAvailableCompanies = async (req: Request, res: Response) => {
    try {
        const questions = await prisma.question.findMany({
            select: {
                companies: true
            }
        });
        // getting the company tags or name from all the questions
        const allCompanies = questions.flatMap(q => q.companies);
        const uniqueCompanies = [...new Set(allCompanies)].sort(); // ascending order me ho gya
        return res.status(200).json({
            companies: uniqueCompanies
        })
    } catch (error) {
        console.error("Error fetching companies:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const getDSARoundSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ error: "SessionId is not present" });
        }
        const session = await prisma.dSARoundSession.findUnique({
            where: {
                id: sessionId.toString()
            },
            include: {
                questions: {
                    include: {
                        testCases: true
                    }
                }
            }
        });
        if (!session) {
            return res.status(404).json({ error: "Session Not Found" });
        };
        // ANTI-CHEAT : remove the hidden test cases
        const sanitized = session.questions.map(q => {
            return {
                ...q, // Keep the title, description, difficulty, id, etc.
                testCases: q.testCases.filter(t => t.isHidden === false) // Overwrite testCases with the filtered array
            };
        });
        // send the sanitized response
        return res.status(200).json({
            success: true,
            questions: sanitized
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

const submitDSARoundSession = async (req: Request, res: Response) => {
    try {
        const { sessionId, submissions } = req.body;
        const userId = req.user?.id;

        if (!sessionId || !submissions || !userId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const session = await prisma.dSARoundSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) return res.status(404).json({ error: "Session not found" });
        if (session.status === "COMPLETED") return res.status(400).json({ error: "Already submitted" });

        // Update status to EVALUATING so they can't submit twice while in queue
        await prisma.dSARoundSession.update({
            where: { id: sessionId },
            data: { status: "TERMINATED" } // Using TERMINATED temporarily as an 'in-queue' lock, or you can add EVALUATING to your enum later
        });

        // Send to BullMQ to process in the background!
        await addArenaSubmissionJob({ sessionId, userId, submissions });

        return res.status(202).json({ message: "Assessment submitted and is being graded." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const getDSARoundReview = async(req: Request, res: Response)=>{
    try {
        const {sessionId} = req.params;
        const userId = req.user?.id
        if(!sessionId){
            return res.status(400).json({error: "SessionId is not present"});
        };
        if(!userId){
            return res.status(403).json({error: "UnAuthorized User"})
        };
        const session = await prisma.dSARoundSession.findUnique({
            where: {id: sessionId.toString()},
            include : {
                submissions: true,
                questions: true
            }
        });
        if(!session){
            return res.status(404).json({error: "Session Not Found"});
        };

        // now we want ki user apna hi report dekhe
        if(session.userId != userId){
            return res.status(403).json({error: "UnAuthorized User"})
        };
        return res.status(200).json({
            success: true,
            session: session
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const getDSARoundHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const history = await prisma.dSARoundSession.findMany({
            where: { userId: userId },
            orderBy: { startedAt: 'desc' }
        });

        return res.status(200).json({ history });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
export {getDSARoundHistory, getDSARoundReview, submitDSARoundSession, getDSARoundSession, getDSARoundQuestions, getAvailableCompanies }
