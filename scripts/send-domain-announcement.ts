import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { domainChangeEmail, EMAIL_BRAND_CID, EMAIL_DOMAIN_CID } from '../lib/email-templates';
import { createMailTransport, mailSender } from '../lib/mail-transport';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

async function main() {
  const args = process.argv.slice(2);
  const recipientsPath = args[args.indexOf('--recipients') + 1];
  const logPath = args[args.indexOf('--log') + 1];
  if (!args.includes('--recipients') || !recipientsPath || !args.includes('--log') || !logPath) throw new Error('Cần --recipients và --log; mặc định chỉ xem trước.');
  const raw: { email: string; name?: string | null }[] = JSON.parse(readFileSync(recipientsPath, 'utf8'));
  const recipients = [...new Map(raw.filter(p => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && !p.email.toLowerCase().endsWith('.invalid')).map(p => [p.email.trim().toLowerCase(), p])).values()];
  const content = domainChangeEmail();
  const key = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  const log: { contentKey: string; sent: string[]; failed: string[] } = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) : { contentKey: key, sent: [], failed: [] };
  if (key !== log.contentKey) throw new Error('Nội dung đã thay đổi so với lượt gửi trước. Cần tệp log mới.');
  const fingerprint = (email: string) => createHash('sha256').update(email.toLowerCase()).digest('hex');
  const pending = recipients.filter(p => !log.sent.includes(fingerprint(p.email)));
  console.log(JSON.stringify({ mode: args.includes('--send') ? 'send' : 'preview', from: mailSender(), subject: content.subject, recipients: recipients.length, pending: pending.length }));
  if (!args.includes('--send')) {
    if (args.includes('--verify')) { const transport = createMailTransport(); await transport.verify(); transport.close(); console.log('SMTP verification passed. No email sent.'); }
    return;
  }
  const transport = createMailTransport();
  await transport.verify();
  for (const person of pending) {
    const id = fingerprint(person.email);
    try {
      const result = await transport.sendMail({ from: mailSender(), to: { name: person.name || '', address: person.email }, ...content, attachments: [
        { filename: 'ielts-vocab.png', path: path.join(process.cwd(), 'public/email-brand.png'), cid: EMAIL_BRAND_CID },
        { filename: 'ielts-domain-update.png', path: path.join(process.cwd(), 'public/email-domain-update.png'), cid: EMAIL_DOMAIN_CID },
      ] });
      if (!result.accepted?.length || result.rejected?.length) throw new Error('Recipient rejected');
      log.sent.push(id); log.failed = log.failed.filter(value => value !== id);
    } catch { if (!log.failed.includes(id)) log.failed.push(id); }
    writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(JSON.stringify({ accepted: log.sent.length, failed: log.failed.length, total: recipients.length }));
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  transport.close();
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Mail operation failed'); process.exitCode = 1; });
