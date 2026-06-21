import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    const limiter = rateLimit(ip, 5, 60000); // 5 requests per minute

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' },
        { status: 429 }
      );
    }
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ. Dữ liệu JSON bị sai định dạng.' },
        { status: 400 }
      );
    }
    const { name, email, password } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không đúng định dạng.' },
        { status: 400 }
      )
    }

    // 2. Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký sử dụng.' },
        { status: 400 }
      )
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      }
    })

    return NextResponse.json(
      { message: 'Đăng ký thành công.', userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống trong quá trình đăng ký.' },
      { status: 500 }
    )
  }
}
