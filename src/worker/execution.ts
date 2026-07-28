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
    // ARENA (CONTEST) FINAL SUBMISSION LOGIC
    else if (job.name === "arena-submission") {
        console.log(`Evaluating Mock Arena Session: ${job.data.sessionId}`);
        const { sessionId, userId, submissions } = job.data;
        let totalScore = 0;

        for (const sub of submissions) {
            // 1. Fetch the question and ALL test cases (including hidden)
            const question = await prisma.question.findUnique({
                where: { id: sub.questionId },
                include: { testCases: true }
            });

            if (!question) continue;

            let finalVerdict: Verdict = "AC";
            
            // 2. If they left it blank, auto-fail
            if (!sub.code || sub.code.trim() === "") {
                finalVerdict = "WA";
            } else {
                // 3. Run against all test cases in Docker
                for (const tc of question.testCases) {
                     
                    const result = await runInDocker({ code: sub.code, language: sub.language, stdin: tc.input });

                    if (result.timedOut) { finalVerdict = "TLE"; break; }
                    if (result.oomKilled) { finalVerdict = "MLE"; break; }
                    if (result.exitCode !== 0) { 
                        finalVerdict = result.stderr.toLowerCase().includes("compile") ? "CE" : "RTE"; 
                        break; 
                    }
                    if (result.stdout.trim() !== tc.expectedOutput.trim()) { 
                        finalVerdict = "WA"; 
                        break; 
                    }
                }
            }

            if (finalVerdict === "AC") totalScore += 1;

            // 4. Save the submission to DB, linked to the Arena Session
            const savedSub = await prisma.submission.create({
                data: {
                    userId,
                    questionId: sub.questionId,
                    dSARoundSessionId: sessionId, // LINK IT TO THE SESSION!
                    code: sub.code,
                    language: sub.language,
                    verdict: finalVerdict,
                    aiFeedback: "Analysis pending..." 
                }
            });

            // 5. Trigger AI Feedback for this specific submission
            addAIFeedbackJob({
                submissionId: savedSub.id,
                questionId: sub.questionId,
                code: sub.code,
                language: sub.language,
                verdict: finalVerdict
            }).catch(err => console.error("Failed AI job", err));
        }

        // 6. Complete the Session!
        await prisma.dSARoundSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                score: totalScore
            }
        });

        console.log(`Arena ${sessionId} evaluated. Score: ${totalScore}/3`);
        return { status: "completed", score: totalScore };
    }

}, { connection: redisConfig });

worker.on("failed", (job: any, err: any) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});
