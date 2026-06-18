import z from "zod"

const UserSchema = z.object({
    name : z.string(),
    email : z.string().email(),
    password : z.string().min(6, "minimum password size is 6").max(15, "maximum password size is 15")
})

const sendOTP = z.object({
    otp : z.string(),
    email : z.string().email()
});

const resendOTP = z.object({
    email : z.string().email()
})
export {sendOTP, resendOTP, UserSchema}