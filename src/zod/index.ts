import z, { string } from "zod"

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
    company : z.string()
})

export { sendOTP, resendOTP, UserSchema, LoginSchema, InterviewStart, EvaluateInterview }