import { Queue } from "bullmq";
import { redisConfig } from "../config/redis.js";
import type { ExecuteRequest, PracticeSubmissionData } from "../zod/index.js";

export const executionQueue = new Queue("code-execution", {
    connection: redisConfig
});

//  For AI Interviews
export const addExecutionJob = async(data: ExecuteRequest) => {
    const job = await executionQueue.add("interview-execution", data);
    return job.id;
}

//   For Practice Arena Submissions
export const addPracticeSubmissionJob = async(data: PracticeSubmissionData) => {
    const job = await executionQueue.add("practice-submission", data);
    return job.id;
}
export const aiFeedbackQueue = new Queue("ai-feedback", {
    connection: redisConfig
});

export const addAIFeedbackJob = async (data: {
    submissionId: string;
    questionId: string;
    code: string;
    language: string;
    verdict: string;
    userApproach?: string;
}) => {
    await aiFeedbackQueue.add("generate-feedback", data);
}
