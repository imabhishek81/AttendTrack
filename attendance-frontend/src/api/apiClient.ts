// ==========================================
// API Client for Spring Boot Backend + JWT Auth
// ==========================================
// 🎓 Spring Boot Learning Note:
// When authenticated, the frontend attaches the Bearer token
// to the HTTP Authorization header:
//   Authorization: Bearer eyJhbGciOi...
// ==========================================

function resolveApiBaseUrl(): string {
  // 1. Check VITE_API_URL from environment
  let envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    envUrl = envUrl.trim();
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    if (!envUrl.endsWith('/api')) {
      envUrl = `${envUrl.replace(/\/+$/, '')}/api`;
    }
    return envUrl;
  }

  // 2. Dynamic host detection for Render, Localtunnel, LAN, Localhost
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    // Cloud Render deployment
    if (host.includes('onrender.com') || host.includes('vercel.app') || host.includes('netlify.app')) {
      return 'https://attendtrack-backend-fidd.onrender.com/api';
    }
    // Auto-detect localtunnel
    if (host.includes('loca.lt')) {
      return 'https://dull-grapes-see.loca.lt/api';
    }
    // Local Wi-Fi / localhost
    return `${window.location.protocol}//${host}:8080/api`;
  }

  return 'http://localhost:8080/api';
}

const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'attendtrack_jwt';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  password?: string;
}

export interface ApiAuthResponse {
  token: string;
  tokenType: string;
  user: ApiUser;
}

export interface ApiSubject {
  id: number;
  name: string;
  code: string;
  teacher: string;
  color: string;
}

export interface ApiSubjectStats {
  subject: ApiSubject;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'DANGER';
  canMiss: number;
  requiredToReach: number;
}

export interface ApiTimetableEntry {
  id: number;
  subject: ApiSubject;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface ApiAttendanceRecord {
  id: number;
  subject: ApiSubject;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'CANCELLED';
}

export interface ApiProjectionItem {
  count: number;
  percentage: number;
  safe: boolean;
}

export interface ApiSubjectDetail {
  subject: ApiSubject;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'DANGER';
  canMiss: number;
  requiredToReach: number;
  requiredPercentage: number;
  projections: ApiProjectionItem[];
  history: ApiAttendanceRecord[];
}

export interface ApiDashboardData {
  user: ApiUser;
  semester: {
    id: number;
    semesterName: string;
    academicYear: string;
    requiredAttendance: number;
  };
  overallPercentage: number;
  overallStatus: 'SAFE' | 'WARNING' | 'DANGER';
  totalClasses: number;
  totalPresent: number;
  subjectsAtRisk: number;
  requiredAttendance: number;
  todaysClasses: Array<{
    timetableEntry: ApiTimetableEntry;
    attendance?: ApiAttendanceRecord | null;
  }>;
  subjectSummaries: ApiSubjectStats[];
}

export interface ApiUserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  requiredAttendance?: number;
}

// Token helper methods
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const API_URL = API_BASE_URL;

export async function checkBackendHealth(): Promise<{ online: boolean; url: string; latency?: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'bypass-tunnel-reminder': 'true' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      return { online: true, url: API_BASE_URL, latency: Date.now() - start };
    }
    return { online: false, url: API_BASE_URL };
  } catch {
    return { online: false, url: API_BASE_URL };
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 10000,
  skipAuth = false
): Promise<T> {
  const token = skipAuth ? null : getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed.message || parsed.error || errorText;
      } catch {
        // not JSON
      }
      throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out (${timeoutMs / 1000}s). The server at ${API_BASE_URL} took too long to respond.`);
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to Spring Boot backend at ${API_BASE_URL}. Ensure the backend is running.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // ─── Authentication ─────────────────────
  async login(email: string, password: string): Promise<ApiAuthResponse> {
    const data = await request<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, 12000, true);
    setStoredToken(data.token);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<ApiAuthResponse> {
    const data = await request<ApiAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, 12000, true);
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<ApiUser> {
    return request<ApiUser>('/auth/me', {}, 5000);
  },

  logout() {
    setStoredToken(null);
  },

  // ─── Dashboard ──────────────────────────
  async getDashboard(userId = 1): Promise<ApiDashboardData> {
    return request<ApiDashboardData>(`/dashboard?userId=${userId}`);
  },

  // ─── Subjects ───────────────────────────
  async getSubjects(semesterId = 1, required = 75): Promise<ApiSubjectStats[]> {
    return request<ApiSubjectStats[]>(`/subjects?semesterId=${semesterId}&required=${required}`);
  },

  async getSubjectStats(id: number, required = 75): Promise<ApiSubjectStats> {
    return request<ApiSubjectStats>(`/subjects/${id}?required=${required}`);
  },

  async createSubject(semesterId = 1, subject: { name: string; code: string; teacher: string; color: string; initialTotal?: number; initialAttended?: number }): Promise<ApiSubject> {
    return request<ApiSubject>(`/subjects?semesterId=${semesterId}`, {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  },

  async updateSubject(id: number, subject: { name: string; code: string; teacher: string; color: string }): Promise<ApiSubject> {
    return request<ApiSubject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject),
    });
  },

  async deleteSubject(id: number): Promise<void> {
    return request<void>(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // ─── Timetable ──────────────────────────
  async getTimetable(semesterId = 1, day?: string): Promise<ApiTimetableEntry[]> {
    const query = day 
      ? `/timetable?semesterId=${semesterId}&day=${encodeURIComponent(day)}`
      : `/timetable?semesterId=${semesterId}`;
    return request<ApiTimetableEntry[]>(query);
  },

  async addTimetableEntry(subjectId: number, entry: { day: string; startTime: string; endTime: string; room: string }): Promise<ApiTimetableEntry> {
    return request<ApiTimetableEntry>(`/timetable?subjectId=${subjectId}`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async deleteTimetableEntry(id: number): Promise<void> {
    return request<void>(`/timetable/${id}`, {
      method: 'DELETE',
    });
  },

  // ─── Attendance ─────────────────────────
  async markAttendance(subjectId: number, date: string, status: 'PRESENT' | 'ABSENT' | 'CANCELLED'): Promise<ApiAttendanceRecord> {
    return request<ApiAttendanceRecord>('/attendance', {
      method: 'POST',
      body: JSON.stringify({ subjectId, date, status }),
    });
  },

  async getSubjectDetail(subjectId: number, required = 75): Promise<ApiSubjectDetail> {
    return request<ApiSubjectDetail>(`/attendance/subject/${subjectId}?required=${required}`);
  },

  async getCalendar(semesterId = 1, startDate: string, endDate: string): Promise<ApiAttendanceRecord[]> {
    return request<ApiAttendanceRecord[]>(`/attendance/calendar?semesterId=${semesterId}&startDate=${startDate}&endDate=${endDate}`);
  },

  // ─── User Profile ───────────────────────
  async getUserProfile(userId = 1): Promise<ApiUserProfile> {
    return request<ApiUserProfile>(`/user/profile?userId=${userId}`);
  },

  async updateUserProfile(data: Partial<ApiUserProfile>, userId = 1): Promise<ApiUserProfile> {
    return request<ApiUserProfile>(`/user/profile?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
