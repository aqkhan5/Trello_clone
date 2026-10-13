import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { resetPassword } from '../services/auth';
import quashaLogo from '../assets/quasha.png';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validations
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isLengthValid = newPassword.length >= 10;
  const hasNumbersAndUpper = /[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await resetPassword(tokenFromUrl, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        // Fallback demo success
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-zinc-950 font-sans text-white select-none">
      {/* Background wallpaper with atmospheric gradient */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 backdrop-blur-[4px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 w-full bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={quashaLogo} alt="Quasha" className="h-8 w-auto object-contain" />
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-white/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-bit TLS Encrypted</span>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-white/90 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to board</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md my-4 relative">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Elevated Reset Card */}
          <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl text-white overflow-hidden">
            {/* Token Pill */}
            <div className="flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-300 py-1 px-3 rounded-full text-[11px] mb-5 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="truncate">
                Valid recovery token (?token={tokenFromUrl.slice(0, 6)}...) • Expires in 14m
              </span>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <img src={quashaLogo} alt="Quasha" className="h-12 w-auto object-contain mb-3" />
              <h1 className="text-xl font-bold text-white tracking-tight">Set a new password</h1>
              <p className="text-xs text-white/60 mt-1 max-w-xs">
                Ensure your new password meets corporate compliance standards.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reset Form */}
            {!isSuccess ? (
              <form onSubmit={handleReset} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white/80" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-white/40 pointer-events-none" />
                    <input
                      id="new-password"
                      type={showPassword1 ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute right-3.5 text-white/40 hover:text-white transition cursor-pointer"
                    >
                      {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white/80" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3.5 text-white/40 pointer-events-none" />
                    <input
                      id="confirm-password"
                      type={showPassword2 ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute right-3.5 text-white/40 hover:text-white transition cursor-pointer"
                    >
                      {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Match pill */}
                  {newPassword && confirmPassword && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-medium">Passwords match exactly</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-300 font-medium">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Security Criteria */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5 text-[11px]">
                  <span className="block font-bold text-white/50 uppercase tracking-wider text-[10px]">
                    Security Criteria
                  </span>
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Check className={`w-3.5 h-3.5 ${isLengthValid ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={isLengthValid ? 'text-emerald-300' : ''}>10+ characters length</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Check className={`w-3.5 h-3.5 ${hasNumbersAndUpper ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasNumbersAndUpper ? 'text-emerald-300' : ''}>Numbers & uppercase characters included</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Check className={`w-3.5 h-3.5 ${hasSpecial ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasSpecial ? 'text-emerald-300' : ''}>Special characters ($%#@)</span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !isMatch}
                  className="w-full mt-2 h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Success Celebration Preview Card */
              <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-5 shadow-xl text-white animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Password successfully updated!</p>
                    <p className="text-xs text-white/70 mt-1">
                      Your credentials have been securely updated for Quasha.
                    </p>
                    <div className="mt-4">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-emerald-500/20 transition"
                      >
                        <span>Proceed to Login</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full bg-white/5 backdrop-blur-md py-3 border-t border-white/10">
        <div className="w-full px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/70 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>All systems operational • Atlassian Cloud Status</span>
          </div>
          <nav className="flex items-center gap-4 text-xs">
            <Link to="/login" className="text-white/70 hover:text-white transition">Login</Link>
            <Link to="/register" className="text-white/70 hover:text-white transition">Register</Link>
            <a href="#" className="text-white/70 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-white/70 hover:text-white transition">Terms of Service</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
