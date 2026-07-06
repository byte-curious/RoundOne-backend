import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis.js";
import { runTestCases } from "../services/judge.js";

const worker = new Worker(
  "code-execution",               
  async (job: Job) => {
    const { code, language, testCases } = job.data;
    const result = await runTestCases({ code, language, testCases });
    return result;               // becomes the job's `returnvalue`, stored in Redis
  },
  { connection: redisConfig,
    concurrency: 4
   }
);

worker.on("completed", (job, result) => {
  console.log(`[${new Date().toISOString()}] Job ${job.id} completed:`, result.overAllVerdict);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
