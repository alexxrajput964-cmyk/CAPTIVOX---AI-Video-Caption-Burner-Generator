import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Smartphone, ArrowRight, Shield, CheckCircle2, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) {
      setErrorMessage('Please enter your mobile number or email');
      return;
    }
    setErrorMessage('');
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await login(phone, email, otp);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Invalid OTP code');
    }
  };

  const handleAdminQuickFill = () => {
    setPhone('9999999999');
    setEmail('admin@captivox.app');
    setStep('otp');
    setOtp('999999');
    setErrorMessage('');
  };

  const handleUserQuickFill = () => {
    setPhone('9876543210');
    setEmail('creator@example.com');
    setStep('otp');
    setOtp('123456');
    setErrorMessage('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const res = await login('', 'creator.google@captivox.app', '', true);
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#141414] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#ff3d5a] to-[#ff8c1a] mx-auto flex items-center justify-center shadow-lg shadow-[#ff3d5a]/25 mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold font-outfit text-white">Sign In to CAPTIVOX</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Generate & burn viral captions for your Reels & Shorts
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[#141414] text-neutral-500">Or phone OTP</span>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Indian Mobile Number or Email
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff3d5a]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              Get Verification Code
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-neutral-400">Enter 6-Digit OTP</span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[#ff8c1a] hover:underline"
                >
                  Change Number
                </button>
              </div>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#ff3d5a]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Studio'}
            </button>
          </form>
        )}

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-center">
            Demo & Admin Test Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleUserQuickFill}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-left hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Public Creator
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">OTP: 123456</div>
            </button>

            <button
              type="button"
              onClick={handleAdminQuickFill}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-left hover:border-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                Master Admin
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">OTP: 999999</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
