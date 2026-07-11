import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { prisma } from "../utils/database/db.js";
import { runInDocker } from "../services/dockerRunner.js";
import { runTestCases } from "../services/judge.js";
import type { Verdict } from "../generated/prisma/enums.js";
import { addAIFeedbackJob } from "../queue/execute.js";

const worker = new Worker("code-execution", async (job: any) => {

    // AI INTERVIEW LOGIC
    if (job.name === "interview-execution") {
        console.log("Running Interview Code...");
        const { code, language, testCases } = job.data;

        const judgeResult = await runTestCases({ code, language, testCases });

        return { status: "completed", result: { results: judgeResult.results } };
    }

    // LEETCODE PRACTICE ARENA LOGIC
    else if (job.name === "practice-submission") {
        console.log(`Evaluating Practice Submission from User: ${job.data.userId}`);
        const { userId, questionId, code, language, testCases, userApproach } = job.data;

        let finalVerdict: Verdict = "AC";
        let failedAtTestCase = 0;

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];

            const result = await runInDocker({ code, language, stdin: tc.input });

            if (result.timedOut) {
                finalVerdict = "TLE";
                failedAtTestCase = i + 1;
                break;
            }

            if (result.oomKilled) {
                finalVerdict = "MLE";
                failedAtTestCase = i + 1;
                break;
            }

            if (result.exitCode !== 0) {
                finalVerdict = result.stderr.toLowerCase().includes("compile") ? "CE" : "RTE";
                failedAtTestCase = i + 1;
                break;
            }
            const actualOutput = result.stdout.trim();
            const expectedOutput = tc.expectedOutput.trim();
            if (actualOutput !== expectedOutput) {
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
                userApproach,
                verdict: finalVerdict,
                timeComplexity: null,
                spaceComplexity: null,
                aiFeedback: null
            }
        });

        console.log(`Submission Verdict: ${finalVerdict}`);

        addAIFeedbackJob({
            submissionId: savedSubmission.id,
            questionId,
            code,
            language,
            verdict: finalVerdict,
            userApproach
        }).catch(err => console.error("Failed to add AI job", err));
        return {
            status: "completed",
            verdict: finalVerdict,
            passed: finalVerdict === "AC",
            failedAt: finalVerdict === "AC" ? null : failedAtTestCase
        };

    }

}, { connection: redisConfig });

worker.on("failed", (job: any, err: any) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});
