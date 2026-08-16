# 🚀 AttendTrack — 100% Free Cloud Deployment Guide

This guide explains how to deploy both the **Spring Boot Backend**, **MySQL Database**, and **React PWA Frontend** to the cloud completely for free!

---

## 🏗️ Architecture Overview

| Component | Technology | Free Cloud Host |
|---|---|---|
| **Frontend** | React 18 + Vite + PWA | **Vercel** / **Netlify** |
| **Backend** | Spring Boot 3.3.4 + Java 21 | **Railway.app** / **Render.com** |
| **Database** | MySQL 8.0 | **Railway MySQL** / **Aiven.io** |

---

## 📦 Step 1: Push Code to GitHub

Open terminal in the project root:

```bash
git init
git add .
git commit -m "Initial commit of full-stack AttendTrack"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AttendTrack.git
git push -u origin main
```

---

## 🗄️ Step 2: Deploy MySQL Database on Railway.app (2 minutes)

1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. Click **+ New Project** → **Provision MySQL**.
3. Once created, click on the MySQL service → Go to the **Variables** tab.
4. Note the connection details:
   - `MYSQLDATABASE` (e.g. `railway`)
   - `MYSQLUSER` (e.g. `root`)
   - `MYSQLPASSWORD`
   - `MYSQLHOST`
   - `MYSQLPORT`

---

## ☕ Step 3: Deploy Spring Boot Backend on Railway.app (3 minutes)

1. In your same Railway project, click **+ New** → **GitHub Repo**.
2. Select your `AttendTrack` repository.
3. Under **Settings**:
   - **Root Directory**: `attendance-backend`
   - **Build Command**: Uses the included `Dockerfile` automatically!
4. Under **Variables**, add these environment variables:
   - `SPRING_DATASOURCE_URL` = `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true`
   - `SPRING_DATASOURCE_USERNAME` = `${{MySQL.MYSQLUSER}}`
   - `SPRING_DATASOURCE_PASSWORD` = `${{MySQL.MYSQLPASSWORD}}`
   - `APP_JWT_SECRET` = `attendtracksecretkeyforjwttokengenerationshouldbelongenough256bitsecurekey`
5. Click **Settings** → **Networking** → **Generate Domain** (e.g. `https://attendtrack-production.up.railway.app`).
6. Your Spring Boot API is now live at: `https://your-backend.up.railway.app/api/dashboard`!

---

## ⚡ Step 4: Deploy React Frontend to Vercel (2 minutes)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project** → Select your `AttendTrack` repository.
3. Configure Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `attendance-frontend`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://your-backend.up.railway.app/api`
5. Click **Deploy**!
6. In ~45 seconds, Vercel will give you a live production URL:
   👉 **`https://attendtrack.vercel.app`**

---

## 🐳 Optional: Run with Docker Compose (Local Production Simulation)

If you have Docker installed on your computer, you can run the entire production stack (MySQL + Backend + Frontend) locally with 1 single command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **MySQL**: `localhost:3306`

---

## ✅ Deployment Checklist

- [ ] React Router SPA rewrites configured in `vercel.json` and `_redirects`
- [ ] PWA Service Worker caching active
- [ ] CORS allows requests from your deployed Vercel domain
- [ ] BCrypt password encryption & JWT enabled in production
- [ ] PWA Manifest installs seamlessly on Android & iOS

**Congratulations! Your full-stack Attendance Tracker is ready for the world! 🎉**
