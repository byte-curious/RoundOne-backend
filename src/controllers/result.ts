import type { Request, Response } from "express";

export const getResult = async (req: Request, res: Response) => {
    return res.status(200).json({ status: "completed" });
};
