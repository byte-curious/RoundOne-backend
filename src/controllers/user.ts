import { type Response, type Request } from "express"
import { UserSchema, sendOTP, resendOTP, LoginSchema } from "../zod/index.js"
import { prisma } from "../utils/database/db.js"
import bcrypt from "bcryptjs"
import { generateOtpEmailTemplate } from "../utils/otpTemplate.js";
import { generateWelcomeEmailTemplate } from "../utils/welcomeTemplate.js"
import jwt from "jsonwebtoken";
const isProd = process.env.NODE_ENV === "production";

// import { Resend } from "resend";
// import nodemailer from "nodemailer";

// const resend = new Resend(process.env.RESEND_API_KEY);

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     family: 4,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//     }
// } as any)

// third try to send otp on render
// --- BREVO EMAIL SETUP START ---

async function sendEmailViaBrevo(to: string, name: string, subject: string, html: string, text: string) {
    const url = "https://api.brevo.com/v3/smtp/email";

    // SENDER_EMAIL must be the email you used to sign up for Brevo
    const senderEmail = process.env.SENDER_EMAIL;
    const apiKey = process.env.BREVO_API_KEY;

    if (!senderEmail || !apiKey) {
        console.error("Missing Brevo credentials in Environment Variables");
        return;
    }

    const payload = {
        sender: { name: "RoundOne", email: senderEmail },
        to: [{ email: to, name: name }],
        subject: subject,
        htmlContent: html,
        textContent: text
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Brevo API Error:", JSON.stringify(errorData));
        }
        // else {
        //     console.log(`Email successfully sent to ${to}`);
        // }
    } catch (error) {
        console.error("Failed to send email via Brevo API:", error);
    }
}

async function sendOtpEmail(to: string, name: string, otp: string) {
    const { subject, html, text } = generateOtpEmailTemplate({ otp, recipientName: name });
    // await resend.emails.send({
    //     from: "RoundOne <onboarding@resend.dev>",
    //     to,
    //     subject,
    //     html,
    //     text
    // });
    // await transporter.sendMail({
    //     from: `"RoundOne" <${process.env.SMTP_USER}>`,
    //      to,
    //     subject,
    //     html,
    //     text,
    // });
    await sendEmailViaBrevo(to, name, subject, html, text);

};
async function sendWelcomeEmail(to: string, name: string) {
    const { subject, html, text } = generateWelcomeEmailTemplate({
        recipientName: name
    })
    // await resend.emails.send({
    //     from: "RoundOne <onboarding@resend.dev>",
    //     to,
    //     subject,
    //     html,
    //     text
    // });
    //  await transporter.sendMail({
    //     from: `"RoundOne"  <${process.env.SMTP_USER}>`,
    //     to,
    //     subject,
    //     html,
    //     text,
    // })
    await sendEmailViaBrevo(to, name, subject, html, text);
};

const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const response = await UserSchema.safeParseAsync({ name, email, password })

        if (!response.success) {
            return res.status(400).json({ "error": response?.error?.issues[0]?.message })
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
            if (new Date() < pendingVerification.expiredAt) {
                return res.status(409).json({ error: "OTP already sent. Please check your email." })
            }

            // resend otp, when it get expired
            // uske liye pahle wala delete to kare
            await prisma.oTPVerification.delete({
                where: {
                    email: response.data.email
                }
            })
        }

        const hashedPassword = await bcrypt.hash(response.data.password, 12);
        const generateOTP = Math.floor(100000 + Math.random() * 900000);
        const expiredAt = new Date(Date.now() + 1 * 60 * 1000) // 10-minute

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

const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const response = await resendOTP.safeParseAsync({ email });
        if (!response.success) {
            return res.status(400).json({ "error": "Enter valid email" })
        };

        const userExist = await prisma.oTPVerification.findUnique({
            where: {
                email
            }
        });
        if (!userExist) {
            return res.status(404).json({
                "error": "Email not found"
            })
        };

        if (new Date() < userExist.expiredAt) {
            return res.status(400).json({
                "error": "OTP is still valid. Please check your email."
            })
        }

        // new OTP + new Expiry
        const newOTP = Math.floor(100000 + Math.random() * 900000);
        const newExpiry = new Date(Date.now() + 1 * 60 * 1000);

        await prisma.oTPVerification.update({
            where: {
                email
            },
            data: {
                otp: newOTP,
                expiredAt: newExpiry
            }
        });
        // email, name, otp
        await sendOtpEmail(email, userExist.name, newOTP.toString());

        return res.status(200).json({
            "message": "New OTP sent successfully."
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            "error": "Internal Server Error"
        });
    }
}

const otpValidation = async (req: Request, res: Response) => {
    try {
        const { otp, email } = req.body;

        if (!otp) {
            return res.status(400).json({ error: "OTP is required" })
        }
        // validate the enter user's data
        const response = await sendOTP.safeParseAsync({
            otp, email
        });
        if (!response.success) {
            return res.status(400).json({
                "error": "Enter Valid Input"
            })
        };

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
        // user transaction to maintain the proper flow 
        // transaction to prevent the consistency 
        await prisma.$transaction([
            prisma.user.create({
                data: {
                    name: record.name,
                    email,
                    password: record.password
                }
            }),
            prisma.oTPVerification.delete({ where: { email } })
        ])

        await sendWelcomeEmail(email, record.name);
        return res.status(201).json({ "message": "user created successfully" });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const response = await LoginSchema.safeParseAsync({ email, password });
        if (!response.success) {
            return res.status(400).json({ "error": response.error })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ "error": "Invalid Credential" });
        };
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ "error": "Invalid Credential" });
        }

        // jwt token -> set to cookies
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                error: "Server configuration error"
            });
        }

        // console.log(secret);
        const payload = {
            id: user.id,
        }
        const jwtExpiry = 60 * 60 * 24 * 7
        const generateJWT = jwt.sign(payload, secret, {
            expiresIn: jwtExpiry
        });
        // set cookie to http-only 
        res.cookie("token", generateJWT, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: jwtExpiry * 1000,
            path: "/",
            domain: ".roundoneprep.me"
        });
        return res.status(200).json({
            "message": "Login Successfully", user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
};

const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            path: "/",
            domain: ".roundoneprep.me"
        });
        return res.status(200).json({ "message": "Logout successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" })
    }
};

const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ error: "UserId is not given" });
        }
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User Not Found" });
        }
        return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
const updatePassword = async (req: Request, res: Response) => {
    try {
        const { resetToken, password, confirmPassword } = req.body;

        if (!resetToken) {
            return res.status(400).json({ error: "Missing or invalid reset session" });
        }
        if (!password || password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const secret = process.env.RESET_TOKEN_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server configuration error" });
        }

        let payload: { email: string };
        try {
            payload = jwt.verify(resetToken, secret) as { email: string };
        } catch {
            return res.status(401).json({ error: "Reset link expired. Please request a new OTP." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { email: payload.email },
            data: { password: hashedPassword }
        });

        return res.status(200).json({ message: "Password Updated Successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const response = await resendOTP.safeParseAsync({ email });
        if (!response.success) {
            return res.status(400).json({ error: "Enter valid email" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
        }

        const existingRequest = await prisma.passwordResetOTP.findUnique({ where: { email } });
        if (existingRequest && new Date() < existingRequest.expiredAt) {
            return res.status(400).json({ error: "OTP already sent. Please check your email." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiredAt = new Date(Date.now() + 1 * 60 * 1000);

        await prisma.passwordResetOTP.upsert({
            where: { email },
            update: { otp, expiredAt },
            create: { email, otp, expiredAt }
        });

        await sendOtpEmail(email, user.name, otp.toString());

        return res.status(200).json({ message: "If that email exists, an OTP has been sent." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const verifyResetOtp = async (req: Request, res: Response) => {
    try {
        const { otp, email } = req.body;
        const response = await sendOTP.safeParseAsync({ otp, email });
        if (!response.success) {
            return res.status(400).json({ error: "Enter Valid Input" });
        }

        const record = await prisma.passwordResetOTP.findUnique({ where: { email } });
        if (!record) {
            return res.status(404).json({ error: "Invalid OTP" });
        }
        if (parseInt(otp) !== record.otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        if (new Date() > record.expiredAt) {
            return res.status(400).json({ error: "Expired OTP" });
        }

        await prisma.passwordResetOTP.delete({ where: { email } });

        const secret = process.env.RESET_TOKEN_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server configuration error" });
        }

        const resetToken = jwt.sign({ email }, secret, { expiresIn: "10m" });
        return res.status(200).json({ message: "OTP verified", resetToken });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { getMe, resendOtp, otpValidation, signup, login, logout, updatePassword, forgotPassword, verifyResetOtp }
