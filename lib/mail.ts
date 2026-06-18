import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export async function sendResetPasswordEmail(email: string, code: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'IELTS Vocab Studio <no-reply@ielts-vocab.com>';

  const isConfigured = smtpHost && smtpPort && smtpUser && smtpPass;

  if (isConfigured) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: 'Reset Password Verification Code - IELTS Vocab',
      text: `Mã xác minh đặt lại mật khẩu của bạn là: ${code} (Hiệu lực 15 phút).\nYour password reset verification code is: ${code} (Valid for 15 minutes).`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #111827; border-radius: 12px; background-color: #fffdf8; box-shadow: 6px 6px 0 #111827;">
          <h2 style="font-family: serif; color: #111827; border-bottom: 2px dashed #111827; padding-bottom: 10px; margin-top: 0;">IELTS Vocab Studio</h2>
          <p style="font-size: 15px; color: #1f2937; margin-bottom: 6px; font-weight: bold;">
            Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác minh dưới đây để hoàn tất:
          </p>
          <p style="font-size: 14px; color: #5b6474; margin-top: 0; font-style: italic; margin-bottom: 20px;">
            You requested a password reset. Please use the verification code below to complete the process:
          </p>
          <div style="background-color: #0ea5e9; color: white; font-family: monospace; font-size: 32px; font-weight: bold; text-align: center; padding: 15px; border: 3px solid #111827; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; box-shadow: 4px 4px 0 #111827;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #5b6474; margin-bottom: 4px; margin-top: 20px;">
            Mã xác minh này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
          </p>
          <p style="font-size: 11px; color: #9ca3af; margin-top: 0; font-style: italic;">
            This verification code is valid for 15 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } else {
    // Development mode / fallback logging
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] DEV EMAIL: Gửi mã xác minh [${code}] tới [${email}]\n`;

    console.log('\x1b[33m%s\x1b[0m', `[DEV EMAIL] Gửi mã xác minh [${code}] tới [${email}]`);

    // Write to project root log
    try {
      fs.appendFileSync(path.join(process.cwd(), 'forgot-password-emails.log'), logMessage);
    } catch (e) {
      console.error('Cannot write log to project root:', e);
    }

    // Write to system artifacts scratch log
    try {
      const scratchDir = '/home/khang/.gemini/antigravity/brain/67e591c7-7c15-476d-abf4-68e32461dcea/scratch';
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, { recursive: true });
      }
      fs.appendFileSync(path.join(scratchDir, 'forgot_password_codes.log'), logMessage);
    } catch (e) {
      // Ignore if cannot write to system folder
    }
  }
}
