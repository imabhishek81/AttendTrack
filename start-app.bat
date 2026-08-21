@echo off
echo ===================================================
echo   Starting AttendTrack Full-Stack Application
echo ===================================================
echo Starting Spring Boot Backend in a new window...
start "AttendTrack Backend" cmd /k "start-backend.bat"

echo Starting Vite React Frontend in a new window...
start "AttendTrack Frontend" cmd /k "cd attendance-frontend && npm run dev"

echo Done! Open http://localhost:5173 in your browser.
