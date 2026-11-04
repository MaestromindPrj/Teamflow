import nodemailer from "nodemailer";

export interface SendOtpEmailParams {
  toEmail: string;
  recipientName: string;
  otpCode: string;
}

export async function sendPasswordResetOtpEmail(
  params: SendOtpEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const senderEmail = process.env.SMTP_SENDER_EMAIL || user;
  const senderName = process.env.SMTP_SENDER_NAME || "TeamFlow Security";

  if (!pass || !user) {
    console.warn("Gmail SMTP credentials (SMTP_USER, SMTP_PASS) are not configured.");
    return {
      success: false,
      error: "Gmail SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASS in .env.local.",
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TeamFlow Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0084d4; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">TeamFlow Enterprise</h1>
              <p style="margin: 4px 0 0 0; color: #e0f2fe; font-size: 13px;">Security & Account Authentication</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 14px; line-height: 22px;">
                Hello <strong>${params.recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 13px; line-height: 22px;">
                We received a request to reset the password for your TeamFlow workspace account. Enter the 6-digit verification code below to authorize your password update:
              </p>
              <!-- OTP Box -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 22px 16px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; color: #0284c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">One-Time Verification Code</span>
                <span style="display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0369a1; font-family: 'Courier New', Courier, monospace;">${params.otpCode}</span>
                <span style="display: block; color: #64748b; font-size: 11px; margin-top: 8px;">Valid for 10 minutes &bull; Do not share with anyone</span>
              </div>
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; line-height: 20px;">
                If you did not request a password reset, you can safely disregard this message. Your existing credentials remain completely secure.
              </p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 18px;">
                TeamFlow Enterprise PM &bull; Automated Security Dispatch &bull; Do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: params.toEmail,
      subject: `${params.otpCode} is your TeamFlow verification code`,
      html: htmlContent,
      text: `Hello ${params.recipientName},\n\nYour TeamFlow verification code is: ${params.otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please disregard.`,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to dispatch email through Gmail SMTP.",
    };
  }
}

export interface SendNewUserCredentialsParams {
  toEmail: string;
  recipientName: string;
  role: string;
  jobTitle: string;
  initialPassword: string;
  loginUrl?: string;
}

export async function sendNewUserCredentialsEmail(
  params: SendNewUserCredentialsParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const senderEmail = process.env.SMTP_SENDER_EMAIL || user;
  const senderName = process.env.SMTP_SENDER_NAME || "TeamFlow Security";

  if (!pass || !user) {
    return {
      success: false,
      error: "Gmail SMTP credentials are not configured.",
    };
  }

  const loginUrl = params.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://teamflow-topaz.vercel.app"}/login`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TeamFlow Login Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background-color: #0084d4; padding: 26px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">MaestroMinds TeamFlow</h1>
              <p style="margin: 4px 0 0 0; color: #e0f2fe; font-size: 13px;">Welcome to the Team &bull; Account Credentials</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 24px;">
                Hello <strong>${params.recipientName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 13px; line-height: 22px;">
                Your workspace account for <strong>MaestroMinds TeamFlow</strong> has been created. You can now log in to the portal using the credentials below:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; padding: 16px 20px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; width: 130px; font-weight: 600;">Login Portal:</td>
                  <td style="padding: 6px 0; font-size: 13px;"><a href="${loginUrl}" style="color: #0084d4; text-decoration: none; font-weight: 600;">${loginUrl}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; font-weight: 600;">Company Email:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a;">${params.toEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 12px; font-weight: 600;">Role / Title:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #334155;">${params.role} &bull; ${params.jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600;">Initial Password:</td>
                  <td style="padding: 8px 0 6px 0;">
                    <span style="display: inline-block; background-color: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: 800; border: 1px solid #bae6fd;">${params.initialPassword}</span>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="${loginUrl}" style="display: inline-block; background-color: #0084d4; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 6px;">
                  Log In to TeamFlow &rarr;
                </a>
              </div>

              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; line-height: 20px;">
                For your account security, we recommend changing your temporary password after logging in from your <strong>Profile Settings</strong>.
              </p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 18px;">
                MaestroMinds TeamFlow &bull; Automated Account Dispatch &bull; Do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: params.toEmail,
      subject: `Welcome to TeamFlow - Your Account Credentials (${params.recipientName})`,
      html: htmlContent,
      text: `Hello ${params.recipientName},\n\nYour MaestroMinds TeamFlow account has been created.\n\nLogin Portal: ${loginUrl}\nEmail: ${params.toEmail}\nRole: ${params.role} (${params.jobTitle})\nTemporary Password: ${params.initialPassword}\n\nPlease sign in and update your password in Profile Settings.\n\nBest regards,\nMaestroMinds TeamFlow`,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to dispatch email through Gmail SMTP.",
    };
  }
}

