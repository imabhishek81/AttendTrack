@echo off
echo ===================================================
echo   Starting AttendTrack Spring Boot Backend (Port 8080)
echo ===================================================
cd attendance-backend

:: Check if global mvn exists, else fallback to user maven
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    mvn spring-boot:run
) else (
    "C:\Users\abhis\.maven\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
)
pause
