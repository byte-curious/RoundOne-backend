import type{ Request, Response } from "express";
import { prisma } from "../utils/database/db.js";

const getProgress = async (req: Request, res: Response) => {
    try {
        const { sheetId } = req.params;
        const userId = req.user!.id;

        if(sheetId == undefined || !sheetId){
            return res.status(400).json({error: "sheetId is not present"})
        }
        const progress = await prisma.progress.findMany({

            where: { userId, sheetId: sheetId.toString() },
            select: { taskId: true } // We only need the task IDs to check the boxes!
        });

        // [{ taskId: "two-sum" }]  convert it to ["two-sum"]
        const completedTasks = progress.map(p => p.taskId);

        return res.status(200).json({ completedTasks });
    } catch (error) {
        console.error("Get progress error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const toggleProgress = async (req: Request, res: Response) => {
    try {
        const { sheetId, taskId } = req.body;
        const userId = req.user!.id;

        if (!sheetId || !taskId) {
            return res.status(400).json({ error: "Missing sheetId or taskId" });
        }

        // Check if the box is already checked
        const existingProgress = await prisma.progress.findUnique({
            where: {
                 userId_taskId_sheetId: {userId, taskId, sheetId}
            }
        });

        if (existingProgress) {
            // If it exists, the user is unchecking the box -> Delete it
            await prisma.progress.delete({
                where: { id: existingProgress.id }
            });
            return res.status(200).json({ status: "unchecked" });
        } else {
            // If it doesn't exist, the user is checking the box -> Create it
            await prisma.progress.create({
                data: { userId, sheetId, taskId }
            });
            return res.status(201).json({ status: "checked" });
        }

    } catch (error) {
        console.error("Toggle progress error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
export {getProgress, toggleProgress}
