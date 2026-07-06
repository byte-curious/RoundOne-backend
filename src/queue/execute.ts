// define the queue instance + a function to add jobs

import {Queue} from "bullmq"
import { redisConfig } from "../config/redis.js";
import {ExecuteSchema} from "../zod/index.js"
import {z} from "zod";


export const executionQueue = new Queue( "code-execution", {
    connection: redisConfig
} );

type ExecutionJobData = z.infer<typeof ExecuteSchema>;


export const addExecutionJob = async(data: ExecutionJobData)=>{
    const job = await executionQueue.add("code-execution", data);
    return job.id;
}


