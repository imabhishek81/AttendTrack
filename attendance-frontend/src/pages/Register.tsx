import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[10%] w-72 h-72 bg-violet-500/[0.07] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-indigo-500/[0.06] rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-[50%] right-[50%] w-64 h-64 bg-pink-500/[0.05] rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/25">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-surface-400 text-sm">Start tracking your attendance today</p>
        </div>

        {/* Form Card */}
        <div className="glass-card-glow p-8 animate-slide-up stagger-2">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); clearError(); }}
                  placeholder="e.g. Rahul Sharma"
                  className="input-field pl-11"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError(); }}
                  placeholder="rahul@example.com"
                  className="input-field pl-11"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  placeholder="Min 6 characters"
                  className="input-field pl-11 pr-12"
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-300">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder="Re-enter password"
                  className="input-field pl-11"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              id="reg-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-surface-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-5 text-center animate-slide-up stagger-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-surface-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>BCrypt Encrypted & Secure Database Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
