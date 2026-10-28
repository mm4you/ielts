import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { domainChangeEmail, feedbackEmail, passwordResetEmail, EMAIL_BRAND_CID } from '../lib/email-templates';

async function main() {
  assert.throws(() => passwordResetEmail('<img/>'));
  const feedback = feedbackEmail({ sender: '<script>bad()</script>', type: 'Góp ý', message: '<img src=x onerror=bad()>\nDòng thứ hai' });
  assert(!feedback.html.includes('<script>'));
  assert(!feedback.html.includes('<img src=x'));
  assert(feedback.html.includes('&lt;img'));
  assert(feedback.html.includes('<br>Dòng thứ hai'));
  for (const mail of [domainChangeEmail(), feedback, passwordResetEmail('123456')]) {
    assert(mail.html.includes('cid:ielts-vocab-brand'));
    assert(mail.html.includes('prefers-color-scheme:dark'));
    assert(!mail.html.includes('box-shadow'));
  }
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  const built = await transport.sendMail({ from: 'IELTS Vocab <sender@example.invalid>', to: 'preview@example.invalid', ...passwordResetEmail('123456'), attachments: [{ filename: 'ielts-vocab.png', path: path.join(process.cwd(), 'public/email-brand.png'), cid: EMAIL_BRAND_CID }] });
  assert(built.message.toString().includes('Content-ID: <ielts-vocab-brand>'));
  console.log('Email templates: HTML escaping, OTP validation and embedded logo passed. No email sent.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
