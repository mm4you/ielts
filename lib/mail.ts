import path from 'node:path';
import { EMAIL_BRAND_CID, passwordResetEmail } from './email-templates';
import { createMailTransport, isMailConfigured, mailSender } from './mail-transport';

export async function sendResetPasswordEmail(email: string, code: string) {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === 'production') throw new Error('Chưa cấu hình dịch vụ gửi email.');
    return;
  }
  const transporter = createMailTransport();
  await transporter.sendMail({
    from: mailSender(),
    to: email, ...passwordResetEmail(code),
    attachments: [{ filename: 'ielts-vocab.png', path: path.join(process.cwd(), 'public/email-brand.png'), cid: EMAIL_BRAND_CID }],
  });
}
