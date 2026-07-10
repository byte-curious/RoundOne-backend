import type { Request, Response } from "express";
import { Job } from "bullmq";
import { executionQueue } from "../queue/execute.js";  

export const getResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if(!id){
        return res.status(400).json({error: "Id not present"});
    }
    
    const job = await Job.fromId(executionQueue, id.toString());

    if (!job) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const state = await job.getState();

    if (state === "completed") {
      return res.status(200).json({ status: "completed", result: job.returnvalue });
    }

    if (state === "failed") {
      return res.status(200).json({ status: "failed", error: job.failedReason });
    }

    // waiting, active, delayed, etc.
    return res.status(200).json({ status: state });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
