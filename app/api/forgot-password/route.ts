import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { action, email, password } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp email.' },
        { status: 400 }
      )
    }

    // 1. Kiểm tra email có hợp lệ
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email không tồn tại trong hệ thống.' },
        { status: 404 }
      )
    }

    if (action === 'verify') {
      return NextResponse.json(
        { message: 'Email hợp lệ.', name: user.name },
        { status: 200 }
      )
    }

    if (action === 'reset') {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.' },
          { status: 400 }
        )
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(password, 10)

      // Cập nhật vào DB
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { password: hashedPassword }
      })

      return NextResponse.json(
        { message: 'Đặt lại mật khẩu thành công.' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Hành động không hợp lệ.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đặt lại mật khẩu.' },
      { status: 500 }
    )
  }
}
