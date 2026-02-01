import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TheFinlog <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your email - TheFinlog',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 400px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                        The<span style="color: #a7f3d0;">Finlog</span>
                      </h1>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #d1fae5;">
                        Your Financial Companion
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                        Verify Your Email
                      </h2>
                      <p style="margin: 0 0 24px; font-size: 14px; color: #71717a; text-align: center; line-height: 1.6;">
                        Enter this verification code to complete your registration:
                      </p>

                      <!-- OTP Box -->
                      <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #059669;">
                          ${otp}
                        </span>
                      </div>

                      <p style="margin: 0 0 8px; font-size: 13px; color: #a1a1aa; text-align: center;">
                        This code will expire in <strong>10 minutes</strong>
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                        If you didn't request this code, please ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                        &copy; ${new Date().getFullYear()} TheFinlog. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send OTP email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending OTP email:', error)
    return false
  }
}

export function generateOTP(): string {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}
