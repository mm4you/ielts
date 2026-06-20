import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ. Dữ liệu JSON bị sai định dạng.' },
        { status: 400 }
      );
    }

    const { action, email, code, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp email.' },
        { status: 400 }
      );
    }

    // 1. Gửi mã xác minh về email
    if (action === 'send_code') {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      let verificationCode = '';
      if (user) {
        // Tạo mã xác minh 6 chữ số
        verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu trữ mã xác minh mới (xóa mã cũ của email này trước)
        await prisma.verificationToken.deleteMany({
          where: { identifier: email.toLowerCase() }
        });

        await prisma.verificationToken.create({
          data: {
            identifier: email.toLowerCase(),
            token: verificationCode,
            expires: new Date(Date.now() + 15 * 60 * 1000) // Hết hạn trong 15 phút
          }
        });

        // Gửi email
        await sendResetPasswordEmail(email.toLowerCase(), verificationCode);
      }

      const isSmtpConfigured = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      );
      const devMode = !isSmtpConfigured || process.env.NODE_ENV === 'development';

      return NextResponse.json({
        message: 'Nếu email tồn tại trong hệ thống, mã xác minh đã được gửi.',
        devMode,
        ...(devMode && user ? { code: verificationCode } : {})
      }, { status: 200 });
    }

    // 2. Xác nhận mã xác minh từ người dùng
    if (action === 'verify_code') {
      if (!code) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp mã xác minh.' },
          { status: 400 }
        );
      }

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          identifier: email.toLowerCase(),
          token: code.trim()
        }
      });

      if (!tokenRecord) {
        return NextResponse.json(
          { error: 'Mã xác minh không chính xác.' },
          { status: 400 }
        );
      }

      if (tokenRecord.expires < new Date()) {
        return NextResponse.json(
          { error: 'Mã xác minh đã hết hạn sử dụng.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: 'Xác minh mã thành công.',
        verified: true
      }, { status: 200 });
    }

    // 3. Đặt lại mật khẩu mới
    if (action === 'reset_password') {
      if (!code) {
        return NextResponse.json(
          { error: 'Thiếu mã xác minh.' },
          { status: 400 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.' },
          { status: 400 }
        );
      }

      // Xác minh mã lại lần nữa trước khi đổi mật khẩu
      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          identifier: email.toLowerCase(),
          token: code.trim()
        }
      });

      if (!tokenRecord) {
        return NextResponse.json(
          { error: 'Mã xác minh không hợp lệ.' },
          { status: 400 }
        );
      }

      if (tokenRecord.expires < new Date()) {
        return NextResponse.json(
          { error: 'Mã xác minh đã hết hạn.' },
          { status: 400 }
        );
      }

      // Kiểm tra xem người dùng có thực sự tồn tại trước khi cập nhật
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Mã xác minh không hợp lệ.' },
          { status: 400 }
        );
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cập nhật mật khẩu và xóa token
      await prisma.$transaction([
        prisma.user.update({
          where: { email: email.toLowerCase() },
          data: { password: hashedPassword }
        }),
        prisma.verificationToken.deleteMany({
          where: { identifier: email.toLowerCase() }
        })
      ]);

      return NextResponse.json({
        message: 'Đặt lại mật khẩu thành công.'
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Hành động không hợp lệ.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đặt lại mật khẩu.' },
      { status: 500 }
    );
  }
}
