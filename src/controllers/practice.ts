// get : practise/questions -> return a list of all question
// use pagination && filter -> pagenation ke liye limit ; 20, filter: 'company', 'difficulty', 'company', 'topic', 
// get : practise/:slug => return that particular question
import type { Request, Response } from "express";
import { prisma } from "../utils/database/db.js";


const getAllQuestions = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query?.page) || 1;
        const limit = Number(req.query?.limit) || 20;
        const company = req.query.company as string || undefined;
        const difficulty = req.query.difficulty as string || undefined;
        const topic = req.query.topic as string || undefined;
        const search = req.query.search as string || undefined;

        const whereClause: any = {};
        if (difficulty) {
            whereClause.difficulty = difficulty.toUpperCase()
        };
        if (company) {
            whereClause.companies = { has: company }
        }
        if (topic) {
            whereClause.topics = { has: topic }
        };
        if (search) {
            whereClause.title = { contains: search, mode: "insensitive" }
        };

        const skip = (page - 1) * limit
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where: whereClause,
                take: limit,
                skip,
                orderBy: {
                    createdAt: "desc"
                },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    difficulty: true,
                    topics: true,
                    companies: true,
                    createdAt: true
                }
            }),
            prisma.question.count({
                where: whereClause
            })
        ]);

        res.status(200).json({
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
        return res.status(500).json({error: "Internal Server Error"})
    }
}
const getQuestionBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: "Slug is not present" });
        }

        const question = await prisma.question.findUnique({
            where: {
                slug: slug.toString()
            },
            include: {
                testCases: {
                    where: {
                        isHidden: false
                    }
                },
                description: true

            }
        });

        if (!question) {
            return res.status(404).json({ error: "Question NOT Found" });
        }

        return res.status(200).json({
            success: true,
            data : question
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal Server Error"})
    }
}

export {getAllQuestions, getQuestionBySlug}
