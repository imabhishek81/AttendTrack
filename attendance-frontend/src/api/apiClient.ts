// ==========================================
// API Client for Spring Boot Backend + JWT Auth
// ==========================================
// 🎓 Spring Boot Learning Note:
// When authenticated, the frontend attaches the Bearer token
// to the HTTP Authorization header:
//   Authorization: Bearer eyJhbGciOi...
// ==========================================

const PUBLIC_BACKEND_TUNNEL = 'https://dull-grapes-see.loca.lt/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('loca.lt')
    ? PUBLIC_BACKEND_TUNNEL
    : (typeof window !== 'undefined' && window.location.hostname
        ? `${window.location.protocol}//${window.location.hostname}:8080/api`
        : 'http://localhost:8080/api'));
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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
}

export const api = {
  // ─── Authentication ─────────────────────
  async login(email: string, password: string): Promise<ApiAuthResponse> {
    const data = await request<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<ApiAuthResponse> {
    const data = await request<ApiAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<ApiUser> {
    return request<ApiUser>('/auth/me');
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

  // ─── Timetable ──────────────────────────
  async getTimetable(semesterId = 1, day?: string): Promise<ApiTimetableEntry[]> {
    const query = day 
      ? `/timetable?semesterId=${semesterId}&day=${encodeURIComponent(day)}`
      : `/timetable?semesterId=${semesterId}`;
    return request<ApiTimetableEntry[]>(query);
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
