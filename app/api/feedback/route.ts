import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import nodemailer from 'nodemailer';

// Helper function to safely escape HTML special characters
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, message, contact } = body;

    // A08:2021 - Server-side validation of inputs
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Nội dung góp ý không được để trống' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Nội dung góp ý vượt quá giới hạn 2000 ký tự' }, { status: 400 });
    }

    if (contact && typeof contact === 'string' && contact.length > 300) {
      return NextResponse.json({ error: 'Thông tin liên hệ vượt quá giới hạn 300 ký tự' }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const receiverEmail = process.env.FEEDBACK_RECEIVER_EMAIL || smtpUser;

    if (!smtpUser || !smtpPassword) {
      console.error('[SECURITY WARNING] SMTP credentials are not configured in environment variables');
      return NextResponse.json(
        { error: 'Tính năng góp ý qua email chưa được thiết lập cấu hình SMTP trên server.' },
        { status: 500 }
      );
    }

    const session = await auth();
    // A01:2021 - Securely bind user context on server, don't trust client input for identity
    const userDisplay = session?.user
      ? `${session.user.name || 'User'} (${session.user.email || 'No Email'}, ID: ${session.user.id || 'N/A'})`
      : 'Khách (Chưa đăng nhập)';

    const typeLabels: Record<string, string> = {
      bug: 'Lỗi hệ thống (Bug report)',
      feature: 'Đề xuất tính năng (Feature request)',
      vocab: 'Góp ý từ vựng (Vocabulary feedback)',
      other: 'Ý kiến khác (Other)',
    };

    const rawTypeLabel = typeLabels[type] || type || 'Không phân loại';

    // A03:2021 - HTML Escape all values dynamically rendered in the HTML email body
    const safeTypeLabel = escapeHtml(rawTypeLabel);
    const safeMessage = escapeHtml(message);
    const safeContact = contact ? escapeHtml(contact) : 'Không cung cấp';

    // Create nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const mailOptions = {
      from: `"IELTS Vocab Feedback" <${smtpUser}>`,
      to: receiverEmail,
      subject: `[IELTS Vocab] Góp ý mới: ${rawTypeLabel}`,
      text: `Chào bạn,

Hệ thống IELTS Vocab nhận được góp ý mới từ người dùng:

- Người gửi: ${userDisplay}
- Phân loại: ${rawTypeLabel}
- Nội dung góp ý:
${message}

- Thông tin liên hệ thêm (nếu có): ${contact || 'Không cung cấp'}

---
IELTS Vocab Mailer`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #000000; border-radius: 12px; background-color: #fbfbfb; box-shadow: 4px 4px 0px #000000;">
          <h2 style="margin-top: 0; color: #2563eb; border-bottom: 2px dashed #000000; padding-bottom: 10px; font-family: serif;">
            [IELTS Vocab] Góp ý từ người dùng
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 130px; border-bottom: 1px solid #e5e7eb;">Người gửi:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(userDisplay)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Phân loại:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="background-color: #fef08a; padding: 2px 6px; border: 1.5px solid #000000; border-radius: 4px; font-weight: bold; font-size: 13px;">
                  ${safeTypeLabel}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Liên hệ thêm:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${safeContact}</td>
            </tr>
          </table>
          <div style="background-color: #f3f4f6; border: 2px solid #000000; border-radius: 8px; padding: 15px; margin-top: 10px; white-space: pre-wrap; font-family: sans-serif; line-height: 1.5;">
            <strong>Nội dung:</strong><br/>
            ${safeMessage}
          </div>
          <p style="font-size: 11px; color: #6b7280; margin-top: 30px; border-top: 2px dashed #000000; padding-top: 10px; text-align: center;">
            Thư này được gửi tự động từ hệ thống IELTS Vocab.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Góp ý của bạn đã được gửi đi thành công!' });
  } catch (error: any) {
    // A09:2021 / A05:2021 - Log detailed errors server-side only, return generic message to client to avoid information disclosure
    console.error('Lỗi khi gửi email góp ý:', error);
    return NextResponse.json(
      { 
        error: 'Không thể gửi email góp ý. Vui lòng thử lại sau.'
      },
      { status: 500 }
    );
  }
}
