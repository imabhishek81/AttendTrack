import { useState, useRef } from 'react';
import { useAppContext } from '../App';
import { mockSemester } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, Mail, GraduationCap, Target, BookOpen, 
  Clock, LogOut, ChevronRight, Save, Camera, Trash2, 
  Upload, Sparkles, Check, Info
} from 'lucide-react';

// Preset avatar options for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export default function Settings() {
  const { 
    logout,
    user, 
    updateUser, 
    updateAvatar, 
    requiredAttendance, 
    setRequiredAttendance 
  } = useAppContext();
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState(user.name);
  const [localRequired, setLocalRequired] = useState(requiredAttendance);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedAttendance, setSavedAttendance] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be under 5MB.');
      return;
    }

    setUploadError(null);

    // Read and compress image using HTML Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          updateAvatar(compressedDataUrl);
          setSavedProfile(true);
          setTimeout(() => setSavedProfile(false), 2000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    updateAvatar(url);
    setUploadError(null);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const handleRemoveAvatar = () => {
    updateAvatar(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadError(null);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateUser({ name: nameInput.trim() });
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const handleSaveAttendance = () => {
    setRequiredAttendance(localRequired);
    setSavedAttendance(true);
    setTimeout(() => setSavedAttendance(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* ─── Profile & Avatar Section ──── */}
      <div className="glass-card p-6 mb-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Profile & Picture</h2>
          {savedProfile && (
            <span className="badge badge-safe text-xs flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>
        
        {/* Avatar Display + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 p-4 rounded-2xl bg-surface-900/40 border border-surface-700/30">
          {/* Main Avatar with Camera Trigger */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-500/20 overflow-hidden ring-2 ring-indigo-500/30 group-hover:ring-indigo-400 transition-all">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>

            {/* Hover overlay with camera icon */}
            <div className="absolute inset-0 rounded-2xl bg-surface-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200 text-white">
              <Camera className="w-6 h-6 mb-1 text-indigo-300" />
              <span className="text-[10px] font-medium tracking-tight">Change</span>
            </div>

            {/* Status dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-surface-950" />
          </div>

          {/* Avatar Actions & Presets */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-0.5">{user.name}</h3>
            <p className="text-xs text-surface-400 mb-3">{mockSemester.semesterName} • {mockSemester.academicYear}</p>
            
            {/* Upload / Remove Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="btn-outline text-xs py-2 px-3 flex items-center gap-1 text-red-400 hover:text-red-300 hover:border-red-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-red-400 text-xs mb-3">{uploadError}</p>
            )}

            {/* Quick Avatar Presets */}
            <div>
              <p className="text-[11px] font-medium text-surface-400 mb-2 flex items-center gap-1 justify-center sm:justify-start">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Or pick an aesthetic preset:
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(url)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 ${
                      user.avatarUrl === url 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                        : 'border-surface-700/50 hover:border-indigo-400/50'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-2">
              <UserIcon className="w-4 h-4 inline mr-2 text-indigo-400" />
              Full Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-2">
              <Mail className="w-4 h-4 inline mr-2 text-indigo-400" />
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              className="input-field opacity-75 cursor-not-allowed"
              readOnly
              title="Email cannot be changed directly in demo mode"
            />
          </div>

          <button
            type="submit"
            className="btn-primary text-sm flex items-center gap-2 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </form>

        {/* Spring Boot Learning Tip */}
        <div className="mt-5 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-surface-400 leading-relaxed">
            <span className="font-semibold text-indigo-300">🎓 Spring Boot Backend Note:</span> In Stage 3/5, avatar uploads are handled via Spring's <code className="text-indigo-300 bg-surface-800 px-1 py-0.5 rounded">MultipartFile</code>:
            <br />
            <code className="text-surface-300 font-mono text-[11px] block mt-1">
              @PostMapping("/api/user/avatar") public ResponseEntity&lt;String&gt; uploadAvatar(@RequestParam("file") MultipartFile file)
            </code>
          </div>
        </div>
      </div>

      {/* ─── Attendance Settings ────────── */}
      <div className="glass-card p-6 mb-5 animate-slide-up stagger-1">
        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Attendance Policy</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-surface-400 mb-3">
            <Target className="w-4 h-4 inline mr-2 text-indigo-400" />
            Required Attendance Percentage
          </label>
          
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="100"
              value={localRequired}
              onChange={e => setLocalRequired(Number(e.target.value))}
              className="flex-1 h-2 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg 
                [&::-webkit-slider-thumb]:shadow-indigo-500/30"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{localRequired}</span>
              <span className="text-lg text-surface-400">%</span>
            </div>
          </div>
          
          <p className="text-xs text-surface-500 mt-2">
            Most universities mandate 75% or 80%. Adjust this based on your college norms.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-400 mb-2">
            <GraduationCap className="w-4 h-4 inline mr-2 text-indigo-400" />
            Current Semester
          </label>
          <input
            type="text"
            value={mockSemester.semesterName}
            className="input-field opacity-75 cursor-not-allowed"
            readOnly
          />
        </div>

        <button
          onClick={handleSaveAttendance}
          className={`mt-4 flex items-center gap-2 ${savedAttendance ? 'btn-outline border-emerald-500/50 text-emerald-400' : 'btn-primary'}`}
        >
          <Save className="w-4 h-4" />
          {savedAttendance ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ─── Quick Links ───────────────── */}
      <div className="glass-card p-6 mb-5 animate-slide-up stagger-2">
        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Quick Links</h2>
        
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/timetable')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-surface-400" />
              <span className="text-sm text-surface-300">Edit Timetable</span>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-600" />
          </button>
          
          <button 
            onClick={() => navigate('/attendance')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-surface-400" />
              <span className="text-sm text-surface-300">Manage Subjects</span>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-600" />
          </button>
        </div>
      </div>

      {/* ─── Account ───────────────────── */}
      <div className="glass-card p-6 animate-slide-up stagger-3">
        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Account</h2>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
