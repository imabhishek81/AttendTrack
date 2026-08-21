import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Register() {
  const { register } = useAppContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError('');

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden noise-overlay">
      {/* ─── Ambient Glow Spheres ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[10%] w-72 h-72 bg-violet-500/[0.08] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-indigo-500/[0.07] rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-[50%] right-[50%] w-64 h-64 bg-pink-500/[0.05] rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* ─── Logo + Header ─────────────── */}
        <div className="text-center mb-6 animate-slide-up">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">Create Account</h1>
          <p className="text-surface-400 text-xs sm:text-sm">Start tracking your attendance with intelligent limits</p>
        </div>

        {/* ─── Registration Form Card ───── */}
        <div className="glass-card gradient-border p-6 sm:p-8 animate-slide-up stagger-2 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); clearError(); }}
                  placeholder="e.g. Rahul Sharma"
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  placeholder="rahul@example.com"
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  placeholder="Min 6 characters"
                  className="input-field pl-10 pr-11 py-2.5 text-xs sm:text-sm"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder="Re-enter password"
                  className="input-field pl-10 py-2.5 text-xs sm:text-sm"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              id="reg-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 font-semibold text-xs sm:text-sm disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-surface-400 text-xs mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-5 text-center animate-slide-up stagger-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-surface-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>BCrypt Encrypted & Secure Database Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
