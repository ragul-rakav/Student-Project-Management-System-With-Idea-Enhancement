<div align="center">

# ProjectPulse — Student Project Management System With Idea Enhancement & Patentability Checker
### Advanced Academic Project Repository, Patentability Evaluator & Originality Governance Platform

**An AI-Powered Academic Portfolio, Hybrid Vector Similarity Engine, Patentability Verifier, Idea Enhancement Recommender, Resubmission Detector & Project Governance Platform**

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vector Search](https://img.shields.io/badge/AI-pgvector%20%2F%20Cosine%20Search-9cf?logo=openai&logoColor=black)](https://github.com/pgvector/pgvector)
[![Express](https://img.shields.io/badge/Server-Express%204.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

### Platform Highlights
- **AI Originality Engine**: Real-time vector similarity detection across title, abstract, problem statement, objectives, methodology, and tech stack.
- **Dynamic Idea Enhancement**: Intelligently recommends 1 to 3 domain-tailored architectural and technical innovations if a submission has low originality, allowing one-click enhancement application.
- **Simplified Patentability & Prior Art Checker**: Plain-language legal criteria evaluation (Novelty, Non-obviousness, Industrial Utility) cross-referenced against external published patents (Google Patents, WIPO, USPTO).
- **Deterministic Domain-to-Faculty Review Mapping**: Automatically routes incoming student submissions strictly to designated testing domain chairs with complete audit records.
- **Rejected Project Detection & Resubmission Audit**: Immutable submission history; flags re-submitted work even under altered titles with original rejecting faculty, date, reason, and prior comments.
- **Professional, Accessible Design**: Subtle, high-contrast, modern slate UI with accessible SVG iconography and zero distracting glows or emojis.

</div>

---

## 👥 Team Details (Team Codexx)

| Role | Member Name | Register Number | Email |
| :--- | :--- | :--- | :--- |
| **Team Lead** | **Aarthi S** | `7376241CS102` | `aarthis.cs24@bitsathy.ac.in` |
| **Member 1** | **Swathi S** | `7376241CS427` | `swathis.cs24@bitsathy.ac.in` |
| **Member 2** | **Abishek R** | `7376241CS111` | `abishekr.cs24@bitsathy.ac.in` |
| **Member 3** | **K S Ragul Rakav** | `7376241CS221` | `ksragulrakav.cs24@bitsathy.ac.in` |

*For complete team member details, see [`TEAM_DETAILS.md`](TEAM_DETAILS.md).*

---

## ✨ ProjectPulse Core Features

### 🧠 1. AI-Powered Similarity & Duplicate Prevention
- Analyzes title, domain category, abstract, problem statement, objectives, methodology, and technical stack.
- Hybrid similarity scoring combines:
  - **Semantic Vector Cosine Distance** (60% weight)
  - **Lexical N-Gram & Jaccard Overlap** (25% weight)
  - **Tech Stack Jaccard Index** (15% weight)
- Evaluates composite originality percentage ($\text{Originality} = 100 - \text{Similarity}$).
- Blocks direct duplicate submissions ($\ge 80\%$ similarity) with actionable student guidance.
- Interactive student **"⚡ Pre-Check Originality"** assistant in the submission modal.

### 🚨 2. Rejected Project Detection & Cross-Faculty Audit
- Maintains an **immutable submission lifecycle** (`submissions`, `review_decisions`, `rejected_resubmission_flags`).
- Rejections are never overwritten or discarded.
- When a student resubmits a similar project under a new or perturbed title:
  - Submissions are flagged: `🚨 Resubmission Alert`.
  - Reviewing faculty (any faculty member) is provided with:
    - Prior project title and submission ID
    - Original rejecting faculty member name
    - Official recorded rejection reason and category
    - Previous faculty review comments
    - Similarity score and matched project sections breakdown (Abstract, Title, Tech)
    - Direct link to inspect the historical decision audit trail.

### ⚖️ 3. Faculty Review Panel & Immutable Decision Audit
- Three distinct evaluation actions:
  - **Approve Submission**: Updates status to Approved, records reviewer identity, and awards gamified credits (+15 Internal, +20 External).
  - **Request Changes**: Records constructive notes and notifies student for revision.
  - **Reject Submission**: Dedicated modal requiring a structured rejection reason category and technical justification. Archived permanently.
- Historical decision log accessible to faculty and administrators at `/api/reviews/history/:submissionId`.

### 🔐 4. Multi-Role Authentication & Access Control
- JWT access tokens coupled with secure HttpOnly refresh-token cookies.
- Server-side RBAC protecting student views from confidential reviewer identities and private faculty notes.
- Tiered repository unlocking based on credits and approved projects.

---

## 🛠️ Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### 1. Backend Setup (`server`)
```bash
cd server
npm install

# Run database migration and seed authentic users & projects into PostgreSQL
node database/migrateAndSeed.js

# Run the test suite
npm test

# Start server
npm run dev
```

### 2. Frontend Setup (`client`)
```bash
cd ../client
npm install
npm run build
npm run dev
```

---

## 🤖 Configuring AI Embedding Providers

ProjectPulse supports pluggable embedding providers configured via `server/.env`:

### Option A: Local Deterministic Vectorizer (Default / Offline / Tests)
No API keys required. Uses a high-performance 128-dimensional subword TF-IDF feature hashing vectorizer:
```env
EMBEDDING_PROVIDER=local
```

### Option B: Google Gemini Embeddings
Generates 768-dimensional semantic embeddings using `text-embedding-004`:
```env
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Option C: OpenAI Embeddings
Generates 1536-dimensional semantic embeddings using `text-embedding-3-small`:
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 🧪 Running Automated Tests

ProjectPulse includes automated unit and integration tests powered by Vitest and Supertest:
```bash
cd server
npm test
```

Test coverage includes:
- **`similarity.test.js`**: Vector normalization, cosine similarity, duplicate detection, rejected resubmission detection, and novel project scoring.
- **`review.test.js`**: Mandatory rejection reasons, immutable decision recording, and cross-role authorization checks.
- **`auth.test.js`**: Access tokens, refresh token creation, rotation, and revocation.
- **`api.test.js`**: HTTP health check, `/api/similarity/check`, duplicate blocking (HTTP 409), and faculty review queue endpoints.

---

## 🚀 Deployment Guide

ProjectPulse is production-ready and architected for seamless cloud deployment:

### Monolithic Full-Stack Deployment (Render / Railway / Heroku / VM)
Because the Vite frontend builds directly into `server/public/` (`npm run build` in `client`), the Node.js Express server serves both the REST API and the static React Single Page Application.

1. **Set Environment Variables on Host**:
   - `PORT`: (Provided dynamically by host, default `5000`)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `postgres://user:password@host:port/database`
   - `JWT_SECRET`: Secure random string (e.g. 64 characters)
   - `JWT_REFRESH_SECRET`: Secure random string
   - `EMBEDDING_PROVIDER`: `local` (or `gemini` / `openai` with relevant API key)

2. **Build & Start Commands**:
   - **Build Command**:
     ```bash
     npm --prefix client install && npm --prefix client run build && npm --prefix server install
     ```
   - **Pre-deploy / Migration Command**:
     ```bash
     node server/database/migrateAndSeed.js
     ```
   - **Start Command**:
     ```bash
     node server/server.js
     ```

### Split Deployment (Vercel Frontend + Render Backend)
- **Frontend (Vercel / Netlify)**:
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist` (or default build target)
  - Environment variable: `VITE_API_URL=https://your-server-domain.com`
- **Backend (Render / Railway)**:
  - Root directory: `server`
  - Start command: `node server.js`

---

## 📄 License
This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.
