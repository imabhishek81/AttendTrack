import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { checkBackendHealth } from '../api/apiClient';
import { DEMO_ACCOUNT } from '../data/mockData';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck, Activity, AlertCircle, PlayCircle } from 'lucide-react';

export default function Login() {
  const { login, loginDemo } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingNotice, setLoadingNotice] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendPing, setBackendPing] = useState<number | undefined>();

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then(res => {
      if (!isMounted) return;
      if (res.online) {
        setBackendStatus('online');
        setBackendPing(res.latency);
      } else {
        setBackendStatus('offline');
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setLoadingNotice('');

    const slowNoticeTimer = setTimeout(() => {
      setLoadingNotice('Connecting to Spring Boot backend...');
    }, 2500);

    try {
      await login(email.trim(), password);
      clearTimeout(slowNoticeTimer);
      navigate('/');
    } catch (err: any) {
      clearTimeout(slowNoticeTimer);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingNotice('');
    }
  };

  const handleDemoBypass = () => {
    loginDemo();
    navigate('/');
  };

  const fillDemoAccount = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setError('');
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden noise-overlay">
      {/* ─── Ambient Glow Spheres ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-indigo-500/[0.08] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-violet-500/[0.07] rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-[60%] left-[60%] w-64 h-64 bg-pink-500/[0.05] rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* ─── Logo + Title ─────────────── */}
        <div className="text-center mb-6 animate-slide-up">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">Welcome Back</h1>
          <p className="text-surface-400 text-xs sm:text-sm">Sign in to track your attendance and safe miss limits</p>

          {/* Backend Status Radar Badge */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/[0.06] backdrop-blur-md bg-white/[0.02]">
            <span className={`w-2 h-2 rounded-full ${
              backendStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
              backendStatus === 'checking' ? 'bg-amber-400 animate-ping' :
              'bg-rose-400'
            }`} />
            <span className="text-surface-300 text-[11px] font-medium font-mono">
              {backendStatus === 'online' && `Spring Boot Online (${backendPing ?? 0}ms)`}
              {backendStatus === 'checking' && 'Connecting to API...'}
              {backendStatus === 'offline' && 'Backend Offline — Demo Ready'}
            </span>
          </div>
        </div>

        {/* ─── Login Card ──────────────── */}
        <div className="glass-card gradient-border p-6 sm:p-8 animate-slide-up stagger-2 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={DEMO_ACCOUNT.email}
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-11 py-2.5 text-xs sm:text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Slow loading notice */}
            {isLoading && loadingNotice && (
              <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 animate-fade-in">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>{loadingNotice}</span>
              </div>
            )}

            {/* Error Message & Demo Mode Fallback */}
            {error && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>

                <button
                  type="button"
                  onClick={handleDemoBypass}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Launch in Offline Demo Mode Instead</span>
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 font-semibold text-xs sm:text-sm disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Controls */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-2 px-2.5 rounded-xl bg-indigo-500/[0.08] hover:bg-indigo-500/[0.15] border border-indigo-500/20 font-semibold active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-fill Demo</span>
            </button>

            <button
              type="button"
              onClick={handleDemoBypass}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors py-2 px-2.5 rounded-xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border border-emerald-500/20 font-semibold active:scale-95"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Demo Bypass</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-surface-400 text-xs mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-5 text-center animate-slide-up stagger-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-surface-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by Spring Security + JWT Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
