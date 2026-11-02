import type { Response, Request } from "express";
import { ExecuteSchema } from "../zod/index.js";
import { runTestCases } from "../services/judge.js";

export const execution = async (req: Request, res: Response) => {
    try {
        const { code, language, testCases } = req.body;
        const response = ExecuteSchema.safeParse({ code, language, testCases });

        if (!response.success) {
            return res.status(400).json({ error: response.error.issues });
        }

        const judgeResult = await runTestCases({ code, language, testCases });
        return res.status(200).json({ status: "completed", result: judgeResult });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
