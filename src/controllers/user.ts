import express from "express"
import { UserSchema } from "../zod/user.js"
import { prisma } from "../utils/database/db.js"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer";
import { generateOtpEmailTemplate } from "../utils/otpTemplate.js";
import { generateWelcomeEmailTemplate } from "../utils/welcomeTemplate.js"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})
async function sendOtpEmail(to: string, name: string, otp: string) {
    const { subject, html, text } = generateOtpEmailTemplate({ otp, recipientName: name });
    await transporter.sendMail({
        from: '"RoundOne" <no-reply@roundone.com>',
        to,
        subject,
        html,
        text,
    });
};
async function sendWelcomeEmail(to: string, name: string) {
  const { subject, html, text } = generateWelcomeEmailTemplate({
    recipientName: name
  })
  await transporter.sendMail({
    from: '"RoundOne" <no-reply@roundone.com>',
    to,
    subject,
    html,
    text,
  })
};

const signup = async (req: any, res: any) => {
    try {
        const { name, email, password } = req.body;
        const response = await UserSchema.safeParseAsync({ name, email, password })

        if (!response.success) {
            return res.status(400).json({ "error": response.error })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: response.data.email }
        })

        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" })
        }
        // After checking users table, also check OTPVerification table
        const pendingVerification = await prisma.oTPVerification.findUnique({
            where: { email: response.data.email }
        })

        if (pendingVerification) {
            return res.status(409).json({ error: "OTP already sent. Please check your email." })
        }

        const hashedPassword = await bcrypt.hash(response.data.password, 12);
        const generateOTP = Math.floor(100000 + Math.random() * 900000);
        const expiredAt = new Date(Date.now() + 10 * 60 * 1000) // 10-minute

        await prisma.oTPVerification.create({
            data: {
                email: response.data.email,
                name: response.data.name,
                password: hashedPassword,
                otp: generateOTP,
                expiredAt: expiredAt
            }
        });

        await sendOtpEmail(response.data.email, response.data.name, generateOTP.toString());

        return res.status(200).json({ "message": "otp send successfully." });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}
const otpValdation = async (req: any, res: any) => {
    try {
        const { otp, email } = req.body;

        if (!otp) {
            return res.json({ error: "OTP not requested for this email" })
        }

        const record = await prisma.oTPVerification.findUnique({
            where: {
                email: email
            }
        });

        if (!record) {
            return res.status(404).json({ error: "Invalid OTP" })
        }
        if (parseInt(otp) !== record.otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        if (new Date() > record.expiredAt) {
            return res.status(400).json({ "error": "Expired OTP" });
        }

        // now yaha pe create karenge user and delete karenge otp record
        await prisma.user.create({
            data: {
                name: record.name,
                email,
                password: record.password
            }
        });
        await prisma.oTPVerification.delete({ where: { email } });
        await sendWelcomeEmail(email, record.name);
        return res.json({ "message": "user created successfully" });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error"})
    }
}

const login = async (req: any, res: any) => {
    try {
        console.log("login");
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
};

const logout = async (req: any, res: any) => {
    return res.json({
        "page": "logout page"
    });
};

export { otpValdation, signup, login, logout }