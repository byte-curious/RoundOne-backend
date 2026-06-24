
export interface WelcomeEmailOptions {
  recipientName: string
  supportEmail?: string
}

export interface WelcomeEmailTemplate {
  subject: string
  html: string
  text: string
}

const PLATFORM_NAME = "RoundOne"
const BRAND_COLOR = "#4F46E5"
const BRAND_COLOR_DARK = "#3730A3"

export function generateWelcomeEmailTemplate({
  recipientName,
  supportEmail = "support@roundone.com",
}: WelcomeEmailOptions): WelcomeEmailTemplate {
  const subject = `Welcome to ${PLATFORM_NAME}, ${recipientName}! 🎯`

  const text = `Hi ${recipientName},

Welcome to ${PLATFORM_NAME} — your personal interview prep buddy.

Here's what you can do right now:
  → Upload your resume and let us build your interview plan
  → Practice HR, Technical, and DSA rounds tailored to your profile
  → Target specific companies like Amazon, Google, and Microsoft
  → Get detailed feedback after every round

Your preparation starts here. Let's get you interview-ready.

Need help? Contact us at ${supportEmail}

— The ${PLATFORM_NAME} Team`

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
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1f2937;">
                Welcome aboard, ${recipientName}! 🎯
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                You've just taken the first step toward acing your next interview. 
                ${PLATFORM_NAME} is your personal mock interview buddy — built around 
                <strong>your resume</strong>, your <strong>target company</strong>, and 
                your <strong>skill level</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#eef2ff;border-radius:8px;border-left:4px solid ${BRAND_COLOR};">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND_COLOR_DARK};text-transform:uppercase;letter-spacing:0.5px;">
                      What you can do right now
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          <span style="color:${BRAND_COLOR};font-weight:700;margin-right:8px;">→</span>
                          Upload your resume and get a personalized interview plan
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          <span style="color:${BRAND_COLOR};font-weight:700;margin-right:8px;">→</span>
                          Practice HR, Technical, and DSA rounds in one session
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          <span style="color:${BRAND_COLOR};font-weight:700;margin-right:8px;">→</span>
                          Target Amazon, Google, Microsoft and more
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:#374151;">
                          <span style="color:${BRAND_COLOR};font-weight:700;margin-right:8px;">→</span>
                          Get detailed AI feedback after every round
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center"> 
                    <a href="https://round-one-frontend.vercel.app/onboarding"
                       style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Start Your First Mock Interview →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;text-align:center;">
                Your preparation starts here. Let's get you interview-ready.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Need help? Contact us at 
                <a href="mailto:${supportEmail}" style="color:${BRAND_COLOR};text-decoration:none;">${supportEmail}</a>
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
</html>`

  return { subject, html, text }
}