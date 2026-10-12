import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Check,
  Building,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { register } from '../services/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live password validation
  const hasMinLength = password.length >= 10;
  const hasSymbolAndNumber = /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasGoodPattern = !/12345|password|qwerty/i.test(password);

  const passedCriteria = [hasMinLength, hasSymbolAndNumber, hasUpperAndLower, hasGoodPattern].filter(Boolean).length;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms of Service to create an account.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await register({
        email,
        full_name: fullName,
        password,
      });
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
      } else {
        setErrorMessage('Unable to complete registration. Please try again.');
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
              <div className="w-8 h-8 rounded-lg bg-[#0052cc] text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/30">
                T
              </div>
              <span className="font-bold text-lg text-white">Trello</span>
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

      {/* Main Registration Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md my-4 relative">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Centered Glass Card */}
          <div className="relative bg-zinc-900/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-white">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-3">
                <div className="w-7 h-7 bg-[#0052cc] rounded-lg p-1 flex gap-1 justify-center items-start shadow-inner">
                  <span className="w-2 h-4 bg-white rounded-xs inline-block" />
                  <span className="w-2 h-2.5 bg-white rounded-xs inline-block" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Create your Trello account</h1>
              <p className="text-xs text-white/60 mt-1 max-w-xs">
                Join over 2,000,000 teams collaborating across the globe
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white/80" htmlFor="fullname">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-white/40 pointer-events-none" />
                  <input
                    id="fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full h-10 bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-white/80" htmlFor="reg-email">
                    Work Email
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    <Building className="w-3 h-3" />
                    <span>Enterprise domain detected</span>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-white/40 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-10 bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Domain Verification pill */}
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-emerald-300 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                    <span>Valid MX records verified (cloudscale.dev)</span>
                  </div>
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white/80" htmlFor="reg-password">
                  Create Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-white/40 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-white/40 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-white/70 mb-1">
                    <span>Password Strength</span>
                    <span className="text-emerald-400 font-semibold">
                      {passedCriteria >= 4 ? 'Strong password' : passedCriteria >= 2 ? 'Medium password' : 'Weak password'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passedCriteria >= step ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Checklist Requirements */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[10px] text-white/75">
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasMinLength ? 'text-emerald-300' : ''}>Min. 10 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3 h-3 ${hasSymbolAndNumber ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasSymbolAndNumber ? 'text-emerald-300' : ''}>1 symbol & number</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3 h-3 ${hasUpperAndLower ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasUpperAndLower ? 'text-emerald-300' : ''}>Upper & lower case</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className={`w-3 h-3 ${hasGoodPattern ? 'text-emerald-400' : 'text-white/30'}`} />
                    <span className={hasGoodPattern ? 'text-emerald-300' : ''}>No common patterns</span>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-xs">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-zinc-950 border-white/20 text-[#0c66e4] accent-[#0c66e4] cursor-pointer"
                  />
                  <span className="text-white/70 leading-snug">
                    I accept the <a href="#" className="text-blue-400 hover:underline">Atlassian Cloud Terms of Service</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-[#0052cc] hover:bg-blue-600 disabled:opacity-75 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full h-px bg-white/10" />
              <span className="absolute bg-zinc-900 px-3 text-[11px] uppercase tracking-wider text-white/40">
                or continue with
              </span>
            </div>

            {/* Social SSO */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-9 px-3 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-xs text-white/90 hover:text-white transition cursor-pointer border border-white/10"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335" />
                  <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4" />
                  <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z" fill="#FBBC05" />
                  <path d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" fill="#34A853" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 h-9 px-3 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-xs text-white/90 hover:text-white transition cursor-pointer border border-white/10"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Footer Redirect */}
            <div className="mt-5 text-center text-xs text-white/60">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-white font-medium hover:underline transition ml-1">
                Log in
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
            <Link to="/register" className="text-white font-medium">Register</Link>
            <a href="#" className="text-white/70 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-white/70 hover:text-white transition">Terms of Service</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;