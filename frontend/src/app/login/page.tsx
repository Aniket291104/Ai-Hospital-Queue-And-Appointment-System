'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { LogIn, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode,
      });
      const { user, token } = response.data;
      
      setAuth(user, token);
      toast.success(`Welcome, ${user.firstName}!`);

      if (user.role === 'Patient') {
        router.push('/patient');
      } else if (user.role === 'Doctor') {
        router.push('/doctor');
      } else if (user.role === 'Receptionist') {
        router.push('/receptionist');
      } else if (user.role === 'Admin' || user.role === 'SuperAdmin') {
        router.push('/admin');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      setAuth(user, token);
      toast.success(`Welcome back, ${user.firstName}!`);

      if (user.role === 'Patient') {
        router.push('/patient');
      } else if (user.role === 'Doctor') {
        router.push('/doctor');
      } else if (user.role === 'Receptionist') {
        router.push('/receptionist');
      } else if (user.role === 'Admin' || user.role === 'SuperAdmin') {
        router.push('/admin');
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.isEmailVerified === false) {
        toast.error(error.response.data.message || 'Email not verified. Another OTP code has been sent.');
        setOtpSent(true);
        if (error.response.data.otp) {
          setOtpCode(error.response.data.otp);
          toast.success(`[DEV] Pre-filled OTP: ${error.response.data.otp}`, { duration: 8000 });
        }
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/google', {
        googleId: 'google_mock_123456789',
        email: email || 'google.user@example.com',
        firstName: 'Google',
        lastName: 'User',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
      });
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Signed in with Google!');
      router.push('/patient');
    } catch (error: any) {
      toast.error('Google Sign In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-x-hidden p-4 md:p-8 flex items-center justify-center">
      {/* DNA Helix Background SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0 flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full min-w-[1200px]" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6AB8FF" />
              <stop offset="100%" stopColor="#CFA3F6" />
            </linearGradient>
            <linearGradient id="dnaGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#CFA3F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6AB8FF" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M-50,300 C150,150 250,450 450,300 C650,150 750,450 950,300 C1150,150 1200,300 1300,300"
            stroke="url(#dnaGrad1)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M-50,300 C150,450 250,150 450,300 C650,450 750,150 950,300 C1150,450 1200,300 1300,300"
            stroke="url(#dnaGrad2)"
            strokeWidth="4"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="w-full max-w-md bg-[#FCFDFF] border border-white/50 p-8 rounded-[32px] shadow-2xl z-10 relative space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-xs">
              H
            </span>
            <span className="text-2xl font-extrabold text-[#2C3137]">HospitalAI</span>
          </Link>
          <p className="text-xs text-[#7C7C7C] font-semibold mt-1">
            {otpSent ? 'Enter OTP sent to your email' : 'Sign in to manage appointments & queue tokens'}
          </p>
        </div>

        {!otpSent ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patient@hospitalai.com"
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-3 pr-3">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C]">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[10px] text-[#6AB8FF] hover:underline font-extrabold">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-[#7C7C7C] font-extrabold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 flex items-center justify-center gap-2 border border-white/60 bg-[#FCFDFF] hover:bg-gray-50 transition-all font-bold text-[#2C3137] rounded-full text-xs shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.78 0 3.38.61 4.64 1.8l3.46-3.46C17.99 1.19 15.15 0 12 0 7.31 0 3.28 2.69 1.34 6.64l4.13 3.2C6.44 6.89 9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.47 14.16c-.24-.73-.38-1.51-.38-2.31s.14-1.58.38-2.31l-4.13-3.2C.5 8.09 0 9.98 0 12s.5 3.91 1.34 5.66l4.13-3.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3 0-5.56-1.85-6.47-4.8l-4.13 3.2C3.28 21.31 7.31 24 12 24z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="text-center text-xs text-[#7C7C7C] font-semibold mt-4">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#6AB8FF] hover:underline font-extrabold">
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-5 py-3 text-center tracking-widest font-extrabold text-sm rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-[#7C7C7C] font-semibold hover:underline mt-2"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
