import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('abhishek@example.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* ─── Floating Background Shapes ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-indigo-500/[0.07] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-violet-500/[0.06] rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-[60%] left-[60%] w-64 h-64 bg-pink-500/[0.05] rounded-full blur-3xl animate-float-slow" />
        
        <div 
          className="absolute top-[12%] right-[18%] w-20 h-20 border border-indigo-500/10 rounded-2xl animate-float-reverse"
          style={{ animationDelay: '0.5s' }}
        />
        <div 
          className="absolute bottom-[25%] left-[15%] w-14 h-14 border border-violet-500/10 rounded-xl animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* ─── Logo + Title ─────────────── */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/25">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-surface-400 text-sm">Sign in to track your attendance</p>
        </div>

        {/* ─── Login Card ──────────────── */}
        <div className="glass-card-glow p-8 animate-slide-up stagger-2">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="abhishek@example.com"
                  className="input-field pl-11"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="input-field pl-11 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                <span className="text-red-400">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-fill Demo Credentials</span>
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-surface-400 text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create Account
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-5 text-center animate-slide-up stagger-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-surface-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by Spring Security + JWT Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
