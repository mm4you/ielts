import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMailTransport, mailSender } from '@/lib/mail-transport';
import path from 'node:path';
import { EMAIL_BRAND_CID, feedbackEmail } from '@/lib/email-templates';
import { feedbackSchema } from '@/lib/validations/feedback';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    const limiter = rateLimit(ip, 5, 60000); // 5 requests per minute

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' },
        { status: 429 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      logger.warn({ errors: validation.error.format() }, 'Validation failed for feedback submission');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { type, message, contact } = validation.data;

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const receiverEmail = process.env.FEEDBACK_RECEIVER_EMAIL || smtpUser;

    if (!smtpUser || !smtpPassword) {
      logger.error('[SECURITY WARNING] SMTP credentials are not configured in environment variables');
      return NextResponse.json(
        { error: 'Tính năng góp ý qua email chưa được thiết lập cấu hình SMTP trên server.' },
        { status: 500 }
      );
    }

    const session = await auth();
    // A01:2021 - Securely bind user context on server, don't trust client input for identity
    const userDisplay = session?.user
      ? `${session.user.name || 'Người dùng'} (${session.user.email || 'Không có email'})`
      : 'Khách (Chưa đăng nhập)';

    const typeLabels: Record<string, string> = {
      bug: 'Báo lỗi',
      feature: 'Đề xuất tính năng',
      vocab: 'Góp ý từ vựng',
      other: 'Ý kiến khác',
    };

    const rawTypeLabel = typeLabels[type] || type || 'Không phân loại';

    // Create nodemailer transport
    const transporter = createMailTransport();

    const mailOptions = {
      from: mailSender(),
      to: receiverEmail,
      ...feedbackEmail({ sender: userDisplay, type: rawTypeLabel, contact, message }),
      attachments: [{ filename: 'ielts-vocab.png', path: path.join(process.cwd(), 'public/email-brand.png'), cid: EMAIL_BRAND_CID }],
    };

    await transporter.sendMail(mailOptions);
    logger.info({ type: rawTypeLabel, userDisplay }, 'Feedback email sent successfully');

    return NextResponse.json({ success: true, message: 'Góp ý của bạn đã được gửi đi thành công!' });
  } catch (error: any) {
    logger.error({ error }, 'Lỗi khi gửi email góp ý');
    return NextResponse.json(
      { 
        error: 'Không thể gửi email góp ý. Vui lòng thử lại sau.'
      },
      { status: 500 }
    );
  }
}
