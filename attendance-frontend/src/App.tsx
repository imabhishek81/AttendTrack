import { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import SubjectDetail from './pages/SubjectDetail';
import CalendarPage from './pages/Calendar';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { AttendanceRecord, User } from './types';
import { mockAttendance, mockUser } from './data/mockData';
import { api, getStoredToken } from './api/apiClient';
import './index.css';

const DEMO_MODE_KEY = 'attendtrack_demo';

function readDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ==========================================
// App-level State Management
// ==========================================
// 🎓 Spring Boot Note:
// In this stage, React Context bridges your frontend state with your
// Spring Boot REST APIs (GET /api/dashboard, POST /api/attendance, etc.)
// ==========================================

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  user: User;
  updateUser: (updated: Partial<User>) => void;
  updateAvatar: (avatarUrl: string | undefined) => void;
  attendanceRecords: AttendanceRecord[];
  markAttendance: (subjectId: string, date: string, status: 'PRESENT' | 'ABSENT') => Promise<void>;
  requiredAttendance: number;
  setRequiredAttendance: (v: number) => void;
  backendConnected: boolean;
  isDemoMode: boolean;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const AppContext = createContext<AppContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  login: async () => {},
  loginDemo: () => {},
  register: async () => {},
  logout: () => {},
  user: mockUser,
  updateUser: () => {},
  updateAvatar: () => {},
  attendanceRecords: [],
  markAttendance: async () => {},
  requiredAttendance: 75,
  setRequiredAttendance: () => {},
  backendConnected: false,
  isDemoMode: false,
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const useAppContext = () => useContext(AppContext);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(readDemoMode);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('attendtrack_user');
      return saved ? JSON.parse(saved) : mockUser;
    } catch {
      return mockUser;
    }
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    readDemoMode() ? mockAttendance : []
  );
  const [requiredAttendance, setRequiredAttendance] = useState(75);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Invalidates in-flight startup auth so it cannot undo a later login/demo session
  const authEpochRef = useRef(0);
  const bumpAuthEpoch = useCallback(() => {
    authEpochRef.current += 1;
    return authEpochRef.current;
  }, []);

  // Check existing JWT token on app start & auto-login
  useEffect(() => {
    const epoch = authEpochRef.current;
    const isStale = () => epoch !== authEpochRef.current;

    async function checkAuthSession() {
      if (readDemoMode()) {
        api.logout();
        if (isStale()) return;
        setIsDemoMode(true);
        setBackendConnected(false);
        setUser(prev => (prev.email ? prev : mockUser));
        setAttendanceRecords(prev => (prev.length ? prev : mockAttendance));
        setIsLoggedIn(true);
        return;
      }

      try {
        if (!getStoredToken()) {
          if (isStale()) return;
          setIsLoggedIn(false);
          try {
            await api.getUserProfile(1);
            if (isStale()) return;
            setBackendConnected(true);
          } catch {
            if (isStale()) return;
            setBackendConnected(false);
          }
          return;
        }

        const me = await api.getMe();
        if (isStale()) return;
        setIsDemoMode(false);
        setUser({
          id: String(me.id),
          name: me.name,
          email: me.email,
          avatarUrl: me.avatarUrl,
        });
        setIsLoggedIn(true);
        setBackendConnected(true);

        const profile = await api.getUserProfile(me.id);
        if (isStale()) return;
        if (profile.requiredAttendance) {
          setRequiredAttendance(profile.requiredAttendance);
        }
      } catch (err) {
        if (isStale()) return;
        api.logout();
        setIsLoggedIn(false);
        try {
          await api.getUserProfile(1);
          if (isStale()) return;
          setBackendConnected(true);
        } catch {
          if (isStale()) return;
          setBackendConnected(false);
        }
      }
    }
    checkAuthSession();
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    bumpAuthEpoch();
    const res = await api.login(email.trim(), password);
    setUser({
      id: String(res.user.id),
      name: res.user.name,
      email: res.user.email,
      avatarUrl: res.user.avatarUrl,
    });
    localStorage.setItem('attendtrack_user', JSON.stringify(res.user));
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    setAttendanceRecords([]);
    setIsLoggedIn(true);
    setBackendConnected(true);
    triggerRefresh();
  }, [bumpAuthEpoch, triggerRefresh]);

  const handleLoginDemo = useCallback(() => {
    bumpAuthEpoch();
    api.logout();
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    setIsDemoMode(true);
    setBackendConnected(false);
    setUser(mockUser);
    localStorage.setItem('attendtrack_user', JSON.stringify(mockUser));
    setAttendanceRecords(mockAttendance);
    setRequiredAttendance(75);
    setIsLoggedIn(true);
    triggerRefresh();
  }, [bumpAuthEpoch, triggerRefresh]);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    bumpAuthEpoch();
    const res = await api.register(name.trim(), email.trim(), password);
    setUser({
      id: String(res.user.id),
      name: res.user.name,
      email: res.user.email,
      avatarUrl: res.user.avatarUrl,
    });
    localStorage.setItem('attendtrack_user', JSON.stringify(res.user));
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    setAttendanceRecords([]);
    setIsLoggedIn(true);
    setBackendConnected(true);
    triggerRefresh();
  }, [bumpAuthEpoch, triggerRefresh]);

  const handleLogout = useCallback(() => {
    bumpAuthEpoch();
    api.logout();
    localStorage.removeItem('attendtrack_user');
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    setAttendanceRecords([]);
    setIsLoggedIn(false);
  }, [bumpAuthEpoch]);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser(prev => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('attendtrack_user', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist user in localStorage', e);
      }
      return next;
    });

    if (!isDemoMode) {
      api.updateUserProfile({
        name: updated.name,
        avatarUrl: updated.avatarUrl,
      }).catch(e => console.warn('Could not sync profile to backend:', e));
    }
  }, [isDemoMode]);

  const updateAvatar = useCallback((avatarUrl: string | undefined) => {
    setUser(prev => {
      const next = { ...prev, avatarUrl };
      try {
        localStorage.setItem('attendtrack_user', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist user in localStorage', e);
      }
      return next;
    });

    if (!isDemoMode) {
      api.updateUserProfile({
        avatarUrl: avatarUrl || '',
      }).catch(e => console.warn('Could not sync avatar to backend:', e));
    }
  }, [isDemoMode]);

  const handleSetRequiredAttendance = useCallback((req: number) => {
    setRequiredAttendance(req);
    if (!isDemoMode) {
      api.updateUserProfile({ requiredAttendance: req })
        .catch(e => console.warn('Could not sync required attendance to backend:', e));
    }
    triggerRefresh();
  }, [isDemoMode, triggerRefresh]);

  const markAttendance = useCallback(async (subjectId: string, date: string, status: 'PRESENT' | 'ABSENT') => {
    // 1. Optimistic local state update
    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(
        r => r.subjectId === subjectId && r.date === date
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], status };
        return updated;
      } else {
        return [...prev, {
          id: String(Date.now()),
          subjectId,
          date,
          status,
        }];
      }
    });

    if (isDemoMode) return;

    // 2. Persist to Spring Boot / MySQL
    try {
      await api.markAttendance(Number(subjectId), date, status);
      setBackendConnected(true);
      triggerRefresh();
    } catch (err) {
      console.warn('Could not save attendance to Spring Boot backend, saved locally:', err);
    }
  }, [isDemoMode, triggerRefresh]);

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn, 
      login: handleLogin,
      loginDemo: handleLoginDemo,
      register: handleRegister,
      logout: handleLogout,
      user,
      updateUser,
      updateAvatar,
      attendanceRecords, 
      markAttendance,
      requiredAttendance,
      setRequiredAttendance: handleSetRequiredAttendance,
      backendConnected,
      isDemoMode,
      refreshTrigger,
      triggerRefresh,
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/" /> : <Login />
          } />
          <Route path="/register" element={
            isLoggedIn ? <Navigate to="/" /> : <Register />
          } />
          <Route path="/" element={
            isLoggedIn ? <Layout /> : <Navigate to="/login" />
          }>
            <Route index element={<Dashboard />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="subject/:id" element={<SubjectDetail />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
