import z from "zod"
import { languageConfigs } from "../config/languages.js";

const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6, "minimum password size is 6").max(15, "maximum password size is 15")
})

const sendOTP = z.object({
    otp: z.string(),
    email: z.string().email()
});

const resendOTP = z.object({
    email: z.string().email()
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

const InterviewStart = z.object({
    company: z.string(), role: z.string(), level: z.string(), language: z.string()
})

const EvaluateInterview = z.object({
    round :  z.string(),
    question : z.string(), 
    answer: z.string(),
    company : z.string(),
    spokenApproach: z.string().optional()
})
const TTSRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  voice: z.string().default("en-IN-NeerjaNeural"),
  rate: z.string().default("+0%"),
  pitch: z.string().default("+0Hz"),
});

const supportedLanguages = Object.keys(languageConfigs) as [string, ...string[]];


const TestCaseSchema = z.object({
    input: z.string(),
    expectedOutput : z.string()
})
const ExecuteSchema = z.object({
    code : z.string().trim().min(1, "code cannot be empty"),
    language: z.enum(supportedLanguages),
    
    testCases : z.array(TestCaseSchema).min(1, "at least 1 test case is required")
});
export type TestCase = z.infer<typeof TestCaseSchema>;
export type ExecuteRequest = z.infer<typeof ExecuteSchema>;

export {TestCaseSchema, ExecuteSchema, sendOTP, resendOTP, UserSchema, LoginSchema, InterviewStart, EvaluateInterview, TTSRequestSchema }
