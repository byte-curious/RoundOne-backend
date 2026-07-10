import "dotenv/config.js"
import { Worker } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { prisma } from "../utils/database/db.js";
import { callGemini } from "../services/gemini.service.js"
import { submissionCodeFeedbackPromptForAC, submissionCodeFeedbackPromptForNotAC } from "../utils/prompts/SubmissionCodeFeedback.js"
const aiWorker = new Worker("ai-feedback", async (job) => {
    console.log(`🧠 Generating AI Feedback for Submission: ${job.data.submissionId}`);

    const { submissionId, questionId, code, language, verdict, userApproach } = job.data;
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { title: true, description: true }
    });
    if (!question) return;
    let feedbackPrompt = "";
    if (verdict == "AC") {
        feedbackPrompt = submissionCodeFeedbackPromptForAC({ question, code, language, userApproach });
    } else {
        feedbackPrompt = submissionCodeFeedbackPromptForNotAC({ question, language, verdict, code, userApproach });
    }

    // call ai 
    try {
        const aiResponse = await callGemini(feedbackPrompt) as string;
    
        const response = JSON.parse(aiResponse.replace(/```json|```/g, "").trim());
    
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                timeComplexity: response.timeComplexity,
                spaceComplexity: response.spaceComplexity,
                aiFeedback: response.aiFeedback
            }
        });
        console.log(`✅ AI Feedback saved for Submission: ${submissionId}`);
    
    } catch (error) {
        console.error("AI Generation Failed:", error);
    }

}, { connection: redisConfig })
