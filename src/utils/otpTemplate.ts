/**
 * template.ts
 * OTP verification email template for RoundOne.
 *
 * Generates the subject, HTML, and plain-text versions of an OTP email.
 * Plug the output into any mailer (Nodemailer, SendGrid, Resend, etc.) —
 * see the usage example at the bottom of this file.
 */

export interface OtpEmailOptions {
  /** The one-time password to display (e.g. "482913") */
  otp: string;
  /** Recipient's display name, used in the greeting */
  recipientName?: string;
  /** Minutes until the OTP expires */
  expiryMinutes?: number;
  /** Support email shown in the footer */
  supportEmail?: string;
}

export interface OtpEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const PLATFORM_NAME = "RoundOne";
const BRAND_COLOR = "#4F46E5";
const BRAND_COLOR_DARK = "#3730A3";

export function generateOtpEmailTemplate({
  otp,
  recipientName = "there",
  expiryMinutes = 10,
  supportEmail = "support@roundone.com",
}: OtpEmailOptions): OtpEmailTemplate {
  const subject = `Your ${PLATFORM_NAME} verification code: ${otp}`;

  const text = `Hi ${recipientName},

Your ${PLATFORM_NAME} verification code is: ${otp}

This code will expire in ${expiryMinutes} minutes. If you didn't request this code, you can safely ignore this email.

Need help? Contact us at ${supportEmail}

— The ${PLATFORM_NAME} Team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${PLATFORM_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <p style="margin:0 0 8px;font-size:16px;color:#1f2937;">Hi ${recipientName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.5;">
                Use the verification code below to complete your sign-in to ${PLATFORM_NAME}.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND_COLOR_DARK};background-color:#eef2ff;padding:16px 28px;border-radius:8px;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
                This code expires in <strong>${expiryMinutes} minutes</strong>.
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                If you didn't request this code, you can safely ignore this email — no action is needed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Need help? Contact us at <a href="mailto:${supportEmail}" style="color:${BRAND_COLOR};text-decoration:none;">${supportEmail}</a>
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#c1c5cb;">
                © ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * Example usage with Nodemailer:
 *
 * import nodemailer from "nodemailer";
 * import { generateOtpEmailTemplate } from "./template";
 *
 * const transporter = nodemailer.createTransport({
 *   host: "smtp.example.com",
 *   port: 587,
 *   auth: { user: "your_user", pass: "your_pass" },
 * });
 *
 * async function sendOtpEmail(to: string, otp: string) {
 *   const { subject, html, text } = generateOtpEmailTemplate({ otp });
 *   await transporter.sendMail({
 *     from: '"RoundOne" <no-reply@roundone.com>',
 *     to,
 *     subject,
 *     html,
 *     text,
 *   });
 * }
 */