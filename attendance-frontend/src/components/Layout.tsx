import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { mockSemester } from '../data/mockData';
import {
  LayoutDashboard, Calendar, BookOpen, BarChart3,
  Settings, Clock, GraduationCap
} from 'lucide-react';
import InstallPrompt from './InstallPrompt';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/timetable', icon: Clock, label: 'Timetable' },
  { path: '/attendance', icon: BookOpen, label: 'Attendance' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppContext();

  return (
    <div className="min-h-screen flex bg-surface-950 relative overflow-hidden">
      {/* Ambient background glows for rich aesthetic */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[10%] w-[350px] h-[350px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* ─── Desktop Sidebar ─────────────── */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-900/30 backdrop-blur-2xl border-r border-white/[0.05] p-5 sticky top-0 h-screen z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-lg" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">AttendTrack</h1>
            <p className="text-[10px] text-surface-600 font-medium uppercase tracking-wider">Attendance Tracker</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <p className="text-[10px] text-surface-600 font-semibold uppercase tracking-wider px-4 mb-3">Menu</p>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom (Click to open Settings) */}
        <div className="pt-4 border-t border-white/[0.04]">
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-indigo-500/30 cursor-pointer transition-all group"
            title="Manage profile & picture"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-1 ring-indigo-500/20 group-hover:ring-indigo-400/50 transition-all">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[2px] border-surface-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{user.name}</p>
              <p className="text-[10px] text-surface-600 truncate">{mockSemester.semesterName}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-surface-600 group-hover:text-surface-400 group-hover:rotate-45 transition-all" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content ──────────────── */}
      <main className="flex-1 pb-20 lg:pb-6 overflow-y-auto min-h-screen relative">
        {/* Subtle mesh gradient on main content area */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/[0.02] rounded-full blur-3xl" />
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-bold text-white">AttendTrack</h1>
            </div>

            {/* Mobile User Avatar trigger */}
            <div 
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden ring-1 ring-indigo-500/30 cursor-pointer"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
          </div>
        </header>

        <div className="relative">
          <Outlet />
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation ──── */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-950/95 backdrop-blur-2xl border-t border-white/[0.06] shadow-2xl"
        style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex justify-around items-center pt-1.5 pb-1 px-1 max-w-md mx-auto">
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-90"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' : 'text-surface-500'
                }`}>
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className={`text-[10px] font-medium tracking-tight ${
                  isActive ? 'text-indigo-300 font-semibold' : 'text-surface-500'
                }`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Banner */}
      <InstallPrompt />
    </div>
  );
}
