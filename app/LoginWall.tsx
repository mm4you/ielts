'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import { LibraryRegular } from '@fluentui/react-icons/svg/library';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { Button } from '@fluentui/react-components';
import BrandMark from '@/components/BrandMark';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginWall() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);

  const [error, _setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  const setError = (msg: string) => {
    _setError(msg);
    if (msg) {
      triggerShake();
    }
  };
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const code = otp.join('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto focus first OTP input when arriving at Step 2
  useEffect(() => {
    if (forgotStep === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [forgotStep]);

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Focus next input if entered a digit
    if (cleanValue !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index] === '' && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^[0-9]{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gửi lại mã xác minh thất bại.');
        setLoading(false);
        return;
      }

      setResendCooldown(60);
      setOtp(Array(6).fill(''));
      if (data.devMode) {
        setIsDevMode(true);
        setDevCode(data.code || '');
      } else {
        setIsDevMode(false);
        setDevCode('');
      }
      setSuccessMsg('Mã xác minh mới đã được gửi thành công đến email của bạn.');
      setLoading(false);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi gửi lại mã xác minh.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Email hoặc mật khẩu không chính xác.');
        setLoading(false);
      } else {
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi đăng nhập.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các thông tin đăng ký.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await regRes.json();

      if (!regRes.ok) {
        setError(data.error || 'Đăng ký thất bại.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Đăng ký tài khoản thành công! Đang đăng nhập...');

      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setMode('login');
        setError('Đăng ký thành công nhưng đăng nhập lỗi, vui lòng đăng nhập lại.');
        setLoading(false);
      } else {
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra trong quá trình đăng ký.');
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập Email để đặt lại mật khẩu.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gửi mã xác minh thất bại.');
        setLoading(false);
        return;
      }

      setForgotStep(2);
      setOtp(Array(6).fill(''));
      setResendCooldown(60);
      if (data.devMode) {
        setIsDevMode(true);
        setDevCode(data.code || '');
      } else {
        setIsDevMode(false);
        setDevCode('');
      }
      setSuccessMsg('Mã xác minh đã được gửi thành công đến email của bạn.');
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi gửi mã xác minh.');
      setLoading(false);
    }
  };

  const handleForgotVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Vui lòng nhập đầy đủ mã xác minh 6 chữ số.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Xác nhận mã thất bại.');
        setLoading(false);
        return;
      }

      setForgotStep(3);
      setSuccessMsg('Xác nhận mã thành công! Vui lòng nhập mật khẩu mới.');
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi xác nhận mã.');
      setLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', email, code, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đặt lại mật khẩu thất bại.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.');
      setMode('login');
      setNewPassword('');
      setConfirmNewPassword('');
      setPassword('');
      setOtp(Array(6).fill(''));
      setForgotStep(1);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi đặt lại mật khẩu.');
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <aside className="login-branding">
        <div className="app-brand"><BrandMark size={38} /><span className="brand-name">IELTS Vocab</span></div>
        <div className="login-branding-content"><BookOpenRegular style={{fontSize:52,color:'var(--blue)'}} /><h2>Học từ vựng IELTS</h2><ul className="login-feature-list"><li><ArrowRepeatAllRegular />Ôn tập bằng flashcard</li><li><LibraryRegular />Từ vựng theo chủ đề và cấp độ</li><li><GamesRegular />Luyện phản xạ qua trò chơi</li></ul></div>
        <div className="login-branding-footer">IELTS Vocabulary Studio</div>
      </aside>

      {/* Right side: Form (Takes full screen on mobile, 50% on desktop) */}
      <div className="login-form-side">
        <div className="bg-orb orb-1 opacity-10"></div>
        <div className="bg-orb orb-2 opacity-10"></div>

        <div className={`login-form-card ${shouldShake ? 'animate-shake' : ''}`}>


        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[var(--ink)] text-center mb-2">
          IELTS Vocab
        </h1>
        <p className="text-[var(--muted)] text-sm font-semibold text-center mb-6">
          {mode === 'forgot' ? 'Khôi phục tài khoản của bạn' : 'Đăng nhập để tiếp tục học.'}
        </p>

        {/* Tab Headers (hidden in Forgot Password mode) */}
        {mode !== 'forgot' && (
          <div className="login-tabs" role="tablist" aria-label="Tài khoản">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              role="tab" aria-selected={mode === 'login'}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              role="tab" aria-selected={mode === 'register'}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Success / Error Message */}
        {error && (
          <div className="bg-[var(--red)] text-white border border-[var(--line)] p-3 font-sans font-semibold text-xs  mb-4 text-left rounded">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-[var(--green)] text-white border border-[var(--line)] p-3 font-sans font-semibold text-xs  mb-4 text-left rounded">
            {successMsg}
          </div>
        )}

        {/* Forms Switch */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Email
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep(1);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-sans font-semibold text-[var(--blue)] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-brutal mt-2 bg-[var(--green)] text-white py-3 font-sans font-semibold text-sm uppercase rounded w-full flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Họ và Tên
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Email
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn-brutal mt-2 bg-[var(--yellow)] text-[var(--ink)] py-3 font-sans font-semibold text-sm uppercase rounded w-full flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <div className="flex flex-col gap-4">
            {forgotStep === 1 && (
              <form onSubmit={handleForgotVerify} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                    Nhập Email đã đăng ký
                  </label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="btn-brutal bg-[var(--paper)] text-[var(--ink)] py-3 font-sans font-semibold text-sm uppercase rounded flex-1 text-center border border-[var(--line)]"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-brutal bg-[var(--blue)] text-white py-3 font-sans font-semibold text-sm uppercase rounded flex-[2] text-center border border-[var(--line)] ${
                      loading ? 'opacity-50' : ''
                    }`}
                  >
                    {loading ? 'Đang gửi...' : 'Gửi mã'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyCode} className="flex flex-col gap-4">
                {isDevMode && (
                  <div className="bg-amber-100 text-amber-950 border border-amber-400 p-3 font-sans text-xs rounded ">
                    <strong>Dev Mode:</strong> Mã xác minh cho {email} là: <strong className="text-sm bg-amber-200 px-2 py-0.5 rounded border border-amber-400">{devCode}</strong> (mã này cũng được ghi vào tệp log).
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase text-center">
                    Nhập mã xác minh (6 chữ số)
                  </label>
                  <div className="flex justify-center gap-2 md:gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        required
                        disabled={loading}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 md:w-14 md:h-16 flex-shrink-0 min-w-0 border border-[var(--line)] font-sans font-semibold text-center text-2xl rounded-xl bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    ))}
                  </div>

                  <div className="text-center mt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendCode}
                      className={`text-xs font-semibold font-sans uppercase tracking-wider underline underline-offset-4 cursor-pointer hover:text-[var(--blue)] transition-colors ${
                        resendCooldown > 0 ? 'text-[var(--muted)] no-underline cursor-not-allowed opacity-75' : 'text-[var(--ink)]'
                      }`}
                    >
                      {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : 'Gửi lại mã xác minh'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="btn-brutal bg-[var(--paper)] text-[var(--ink)] py-3 font-sans font-semibold text-sm uppercase rounded flex-1 text-center border border-[var(--line)]"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-brutal bg-[var(--blue)] text-white py-3 font-sans font-semibold text-sm uppercase rounded flex-[2] text-center border border-[var(--line)] ${
                      loading ? 'opacity-50' : ''
                    }`}
                  >
                    {loading ? 'Đang xác nhận...' : 'Xác nhận mã'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-[var(--ink)] uppercase">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full border border-[var(--line)] p-3 font-sans font-semibold text-base md:text-sm rounded bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:bg-[var(--brand-soft)]   transition-all"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(2);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="btn-brutal bg-[var(--paper)] text-[var(--ink)] py-3 font-sans font-semibold text-sm uppercase rounded flex-1 text-center border border-[var(--line)]"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-brutal bg-[var(--green)] text-white py-3 font-sans font-semibold text-sm uppercase rounded flex-[2] text-center border border-[var(--line)] ${
                      loading ? 'opacity-50' : ''
                    }`}
                  >
                    {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t-2 border-dashed border-[var(--line)] w-full my-6 relative flex items-center justify-center">
          <span className="bg-[var(--paper)] px-3 text-xs font-sans font-semibold text-[var(--muted)] uppercase absolute">
            Hoặc
          </span>
        </div>

        {/* Google Login Button */}
        <Button
          appearance="secondary"
          size="large"
          onClick={() => {
            if (loading) return;
            signIn('google');
          }}
          disabled={loading}
          className="google-login-button"
        >
          Đăng nhập bằng Google
        </Button>
      </div>
      </div>
    </main>
  );
}
