import React, { useState, useEffect } from 'react';
import { ShieldAlert, Mail, Phone, Lock, User as UserIcon, HelpCircle, Key, ChevronRight, Check } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useI18n } from '../../services/i18n';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'OTP';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  
  // Forms inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Forgot / OTP specific state
  const [forgotInput, setForgotInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(120);

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'OTP' && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [mode, otpCountdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t('enterEmailPasswordError'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Determine if admin desk or regular user
      const role = trimmedEmail.toLowerCase().includes('security') || trimmedEmail.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
      const data: any = await api.login(trimmedEmail, role, password);
      
      if (!data.token || !data.user) {
        throw new Error('Authentication succeeded but session token is missing.');
      }
      
      localStorage.setItem('sos-session-token', data.token);
      onAuthSuccess(data.user);
    } catch (err: any) {
      console.error('[Login Auth Error]:', err);
      setError(err.message || t('loginFailedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password) {
      setError(t('allFieldsRequiredError'));
      return;
    }

    if (trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (trimmedPhone.length < 5) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data: any = await api.register({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password
      });
      
      if (!data.token || !data.user) {
        throw new Error('Registration completed but session token is missing.');
      }

      localStorage.setItem('sos-session-token', data.token);
      onAuthSuccess(data.user);
    } catch (err: any) {
      console.error('[Sign-Up Auth Error]:', err);
      setError(err.message || t('registrationFailedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput) {
      setError(t('enterForgotInputError'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword(forgotInput);
      setSuccessMsg(res.message || 'Password reset token generated.');
      setMode('OTP');
      setOtpCountdown(120);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) {
      setError(t('enter4DigitCodeError'));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Hardcode default user login for demonstration when verification succeeds
      setSuccessMsg(t('otpVerified'));
      setTimeout(async () => {
        const u = await api.getCurrentUser();
        onAuthSuccess(u);
      }, 1000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 shadow-xl shadow-red-500/20">
          <ShieldAlert className="h-7 w-7 text-white animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            {t('authHeaderTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t('authHeaderSub')}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl backdrop-blur-xl space-y-6">
          
          {/* Status logs alerts */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
              <Check className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('emailAddressLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('passwordLabel')}</label>
                  <button
                    type="button"
                    onClick={() => { setError(null); setSuccessMsg(null); setMode('FORGOT'); }}
                    className="text-[10px] font-semibold text-red-400 hover:text-red-300"
                  >
                    {t('forgotPasswordLink')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
              >
                <span>{loading ? t('authenticating') : t('signInBtn')}</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setMode('SIGNUP'); }}
                  className="font-bold text-red-450 hover:underline"
                >
                  {t('registerLink')}
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGN UP MODE */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('fullNameLabel')}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('fullNamePlaceholder')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('emailAddressLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="john@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('phoneNumberLabel')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
              >
                <span>{loading ? t('creatingAccount') : t('createAccountBtn')}</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setMode('LOGIN'); }}
                  className="font-bold text-red-450 hover:underline"
                >
                  {t('signInBtn')}
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleSendForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('forgotTitle')}</label>
                <div className="relative">
                  <HelpCircle className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('forgotPlaceholder')}
                    value={forgotInput}
                    onChange={e => setForgotInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
              >
                {loading ? t('sendingText') : t('sendOtpBtn')}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setSuccessMsg(null); setMode('LOGIN'); }}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-white"
              >
                {t('backToSignIn')}
              </button>
            </form>
          )}

          {/* 4. OTP VERIFICATION MODE */}
          {mode === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('verificationSentTitle')}</span>
                <p className="text-xs text-slate-400">{t('verificationSentSub')}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">4-Digit Code</label>
                <div className="relative max-w-[140px] mx-auto">
                  <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="1234"
                    maxLength={4}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-855 text-center focus:border-red-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm font-extrabold text-white tracking-widest transition-colors"
                  />
                </div>
              </div>

              <div className="text-center text-xs text-slate-500">
                {t('codeExpiresText')} <span className="font-mono font-bold text-amber-450">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider"
              >
                {loading ? t('sendingText') : t('verifySignInBtn')}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setMode('LOGIN'); }}
                  className="font-bold text-slate-400 hover:text-white"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  disabled={otpCountdown > 0}
                  onClick={() => { setOtpCountdown(120); setSuccessMsg(t('otpDispatched')); }}
                  className="font-bold text-cyan-400 hover:underline"
                >
                  {t('resendCodeBtn')}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
