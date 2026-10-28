import nodemailer from 'nodemailer';

export function isMailConfigured() { return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD); }
export function mailSender() {
  const from = process.env.SMTP_FROM;
  return { name: 'IELTS Vocab', address: from?.match(/<([^>]+)>/)?.[1] || from || process.env.SMTP_USER || '' };
}
export function createMailTransport() {
  if (!isMailConfigured()) throw new Error('Chưa cấu hình dịch vụ gửi email.');
  const port = Number(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
}
