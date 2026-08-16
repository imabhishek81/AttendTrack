# 🎓 AttendTrack — Smart Student Attendance Tracker & Projection Engine

> A modern full-stack web application and Progressive Web App (PWA) designed for college students to track daily attendance, calculate real-time safe miss projections (*"Can I Miss?"*), recover deficits, and stay comfortably above attendance thresholds (75%).

![AttendTrack Banner](https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

- ⚡ **Instant Attendance Calculation Engine**: Automatically calculates overall and subject-level attendance percentages in real time.
- 🎯 **"Can I Miss?" Projection Engine**: Computes exact numbers of lectures a student can safely skip while staying above minimum criteria (e.g., 75%).
- 🩹 **Deficit Recovery Formula**: Suggests how many consecutive future classes must be attended to recover from danger status.
- 📱 **Progressive Web App (PWA)**: 1-tap installable native mobile app experience for Android, iOS, and Desktop with offline caching via Service Worker.
- 🔐 **Spring Security 6 + JWT Authentication**: BCrypt password encryption, stateless JWT tokens, and multi-user database support.
- 📊 **Interactive Analytics & Timetable**: Weekly scheduled slots, monthly heatmap calendar, and distribution charts powered by Recharts.
- 🎨 **Sleek Glassmorphism Dark UI**: Mesh gradient backgrounds, tactile touch ergonomics, and custom avatar compression & storage.

---

## 🏛️ System Architecture

```
                    ┌──────────────────────────────────────┐
                    │       React 18 + TypeScript          │
                    │   Tailwind CSS + PWA (Mobile-First)  │
                    └──────────────────┬───────────────────┘
                                       │ REST API (JSON + JWT)
                                       ▼
                    ┌──────────────────────────────────────┐
                    │     Spring Boot 3.3.4 (Java 21)      │
                    │  - Spring Security 6 (BCrypt / JWT)  │
                    │  - Attendance Calculation Engine     │
                    │  - JPA / Hibernate REST Controllers  │
                    └──────────────────┬───────────────────┘
                                       │ JDBC Connection
                                       ▼
                    ┌──────────────────────────────────────┐
                    │          MySQL 8.0 Database          │
                    │    (Users, Semesters, Subjects,      │
                    │      Timetable, Attendance DB)       │
                    └──────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite |
| **Mobile / PWA** | Web App Manifest, Service Worker, Cache-First & Stale-While-Revalidate |
| **Backend** | Spring Boot 3.3.4, Java 21 LTS, Maven 3.9, Spring Data JPA, Hibernate |
| **Security** | Spring Security 6, JJWT 0.12.6, BCryptPasswordEncoder |
| **Database** | MySQL 8.0 / H2 in-memory fallback |
| **DevOps** | Docker, Docker Compose, Nginx, Vercel, Railway |

---

## 🚀 Quick Start (Running Locally)

### Prerequisites:
- **Node.js**: v18+ 
- **Java JDK**: 21 LTS
- **Apache Maven**: 3.9+
- **MySQL Server**: 8.0 (Service running on port 3306)

### 1. Clone the Repository:
```bash
git clone https://github.com/imabhishek81/AttendTrack.git
cd AttendTrack
```

### 2. Start Backend (Spring Boot):
```bash
cd attendance-backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080/api`*

### 3. Start Frontend (React + Vite):
```bash
cd ../attendance-frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173/`*

---

## 🐳 Running with Docker Compose

To launch MySQL, Spring Boot, and React together in isolated containers:

```bash
docker compose up --build
```

---

## 🤖 Engineering & Prompts Methodology

During development, an agentic AI pair-programming workflow was utilized across 7 structured phases:

1. **Phase 1 (UI Architecture)**: *"Build a high-aesthetic glassmorphism dark theme UI prototype in React + TypeScript with 8 comprehensive student pages."*
2. **Phase 2 & 3 (Backend & Database)**: *"Scaffold Spring Boot 3 with Java 21 and JPA entities (User, Semester, Subject, Timetable, Attendance). Implement mathematical projection services in Java."*
3. **Phase 4 (Full-Stack Integration)**: *"Bridge React frontend to live Spring Boot REST endpoints with optimistic state updates and live sync."*
4. **Phase 5 (Authentication)**: *"Secure application with Spring Security 6, BCrypt password hashing, and stateless JWT Bearer token authentication."*
5. **Phase 6 (PWA & Mobile Ergonomics)**: *"Add Web App Manifest, Service Worker offline caching, and iOS/Android home screen install capability with tactile 44px thumb targets."*
6. **Phase 7 (DevOps & Packaging)**: *"Build multi-stage production Dockerfiles, SPA fallback routing rules, and cloud deployment configuration."*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new student account (creates starter subjects + JWT) |
| `POST` | `/api/auth/login` | Authenticate credentials & return signed JWT Bearer token |
| `GET` | `/api/auth/me` | Fetch authenticated student profile |
| `GET` | `/api/dashboard` | Overall attendance %, subjects at risk, today's schedule |
| `POST` | `/api/attendance` | Mark lecture as PRESENT / ABSENT on a date |
| `GET` | `/api/attendance/subject/{id}` | Subject details with *"Can I Miss?"* simulation |
| `GET` | `/api/attendance/calendar` | Monthly attendance history heatmap |
| `GET` | `/api/subjects` | List subjects with computed percentages |
| `GET` | `/api/timetable` | Get weekly class schedule |
| `PUT` | `/api/user/profile` | Update profile avatar and attendance criteria |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
