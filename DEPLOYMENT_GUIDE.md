# 🚀 Vercel + Railway + Neon Deployment Guide

This project is fully configured for a decoupled, high-speed production deployment:
* **Frontend:** [Vercel](https://vercel.com) (Edge CDN with React 19 + Vite)
* **Backend:** [Railway](https://railway.app) (Express REST API with BullMQ & local embeddings)
* **Database:** [Neon](https://neon.tech) (Serverless PostgreSQL with SSL)

---

## Step 1: Create Free PostgreSQL Database on Neon (2 mins)

1. Go to [neon.tech](https://neon.tech) and sign up / log in with GitHub.
2. Click **Create Project**:
   * Name: `student-project-repository`
   * Region: Choose the region closest to you (e.g., `AWS Asia Pacific (Singapore)` or `US East`).
3. On the Neon dashboard, copy your **Connection String**:
   * Ensure **Pooled connection** or direct connection string is copied.
   * Format: `postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`

---

## Step 2: Deploy Backend to Railway (5 mins)

1. Push all your latest commits to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel + Railway + Neon deployment"
   git push origin main
   ```
2. Go to [railway.app](https://railway.app) and log in with GitHub.
3. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
4. Select `Student-Project-Management-System-With-Idea-Enhancement`.
5. In your Railway service settings:
   * **Root Directory:** You can leave it as default `/` (the root `railway.json` and `Procfile` will handle it) or set it to `server`.
   * Under the **Variables** tab, add the following environment variables:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | Connection string copied from Neon |
| `NODE_ENV` | `production` | Enables production optimizations & secure cookies |
| `PORT` | `5000` | Port for Express (Railway also auto-assigns `PORT`) |
| `JWT_SECRET` | `super_secret_jwt_key_projecthub_2026` | Generate or use a secure random string |
| `JWT_REFRESH_SECRET` | `super_secret_refresh_jwt_key_projectpulse_2026`| Generate or use a secure random string |
| `EMBEDDING_PROVIDER` | `local` | Uses offline vectorizer (no OpenAI/Gemini cost) |
| `CLIENT_URL` | `https://*.vercel.app` *(update with exact Vercel URL in Step 4)* | Allowed CORS origin |

6. Under the **Settings** tab $\rightarrow$ **Networking**, click **Generate Domain**.
   * You will receive a URL like: `https://student-project-repo-production.up.railway.app`
   * Copy this URL for Step 3.

> ℹ️ *Note: On deployment, Railway runs `node server/database/migrateAndSeed.js` automatically to create all tables and seed sample accounts!*

---

## Step 3: Deploy Frontend to Vercel (3 mins)

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your repository: `Student-Project-Management-System-With-Idea-Enhancement`.
4. Configure the Project:
   * **Root Directory:** Click **Edit** and select `client` (or leave root; both `client/vercel.json` and root `vercel.json` are pre-configured).
   * **Framework Preset:** Vite
   * **Environment Variables:**
     * Name: `VITE_API_URL`
     * Value: Your Railway Backend URL from Step 2 (e.g. `https://student-project-repo-production.up.railway.app`)
5. Click **Deploy**.
6. Vercel will build and assign you a live production URL (e.g. `https://student-project-mgmt.vercel.app`).

---

## Step 4: Final 1-Minute Hookup (CORS & Cookies)

1. Go back to your **Railway Dashboard** $\rightarrow$ **Variables**.
2. Update `CLIENT_URL` to your exact Vercel domain:
   ```env
   CLIENT_URL=https://student-project-mgmt.vercel.app
   ```
3. Railway will instantly redeploy with the updated CORS policy.

---

## Step 5: Test & Verify

Open your live Vercel URL in a browser:
1. **Quick Login:** Click any role shortcut on the login page:
   * **Student:** `kavitha.m@student.edu` / `password`
   * **Faculty:** `senthamizhan.v@faculty.edu` / `password`
   * **Admin:** `admin@projectpulse.edu` / `password`
2. **Submit a Project:** Fill in title, abstract, tech stack and test the real-time AI Originality and Patentability checkers.
3. **Faculty Review:** Switch to faculty and approve/reject or review resubmissions with audit history.

🎉 Everything is now live, fast, and connected to cloud PostgreSQL!

