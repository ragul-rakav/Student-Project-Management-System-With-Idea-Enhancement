# Student Project Management System With Idea Enhancement & Patentability Checker

An intelligent academic platform that manages student projects, prevents duplicate submissions using AI originality checking, evaluates patentability against prior art, suggests innovation ideas, and streamlines faculty reviews.

---

## 📌 What is in this Project?

### 1. 🔍 AI Originality Checker
- Checks draft project proposals in real-time before submission.
- Uses a hybrid similarity score (semantic vector similarity + text matching + tech stack overlap).
- Automatically warns or blocks submissions if they are too similar to existing projects in the repository.

### 2. 💡 Idea Enhancement Recommender
- When a project has low originality or routine concepts, the system suggests **1 to 3 domain-tailored technical enhancements** (e.g., adding edge AI processing, verifiable cryptographic audit logs, or privacy-preserving federated models).
- Students can apply suggested enhancements with a single click to upgrade their proposal.

### 3. 📜 Simplified Patentability & Prior Art Checker
- Analyzes submissions against legal patent standards:
  - **Novelty** (Are the core mechanisms new?)
  - **Non-Obviousness** (Is it an inventive step beyond standard web/CRUD apps?)
  - **Industrial Applicability** (Can it solve real-world industry problems?)
- Cross-references external databases (such as Google Patents) to detect similar patents and provide clear justifications.

### 4. 👨‍🏫 Testing Faculty Review Panel & Routing
- Projects are deterministically mapped to domain chairs for review:
  - **Web Development & Full-Stack** $\rightarrow$ Dr. Senthamizhan V
  - **AI & Machine Learning** $\rightarrow$ Dr. Aarthi S
  - **Mobile & IoT** $\rightarrow$ Dr. Thenmozhi K
- If a rejected project is resubmitted under a modified title, faculty see a **Resubmission Alert** with previous rejection reasons and reviewer feedback.
- Faculty can **Approve**, **Request Changes**, or **Reject** with recorded reasons.

### 5. ⚡ Quick Testing Tools
- Includes instant test login shortcuts on the login page for quick role switching (Student, Faculty, Admin).
- Form shuffle/random fill buttons to instantly test submission forms without repetitive typing.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)

---

### Step 1: Set up the Database

1. Open PostgreSQL (e.g. pgAdmin or psql) and create a database:
   ```sql
   CREATE DATABASE student_project_repository;
   ```

2. Configure environment variables in `server/.env` (you can copy `server/.env.example`):
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/student_project_repository
   JWT_SECRET=your_jwt_secret_key
   EMBEDDING_PROVIDER=local
   ```
   *(Note: `EMBEDDING_PROVIDER=local` runs completely offline with no external API keys required).*

---

### Step 2: Set up & Start the Backend

Open a terminal in the root folder:

```bash
cd server
npm install

# Run migration to create tables and seed default users & sample projects
node database/migrateAndSeed.js

# Start backend server
npm run dev
```

The backend server will run at: **http://localhost:5000**

---

### Step 3: Set up & Start the Frontend

Open a second terminal in the root folder:

```bash
cd client
npm install

# Start Vite frontend dev server
npm run dev
```

The frontend application will run at: **http://localhost:5173**

---

## 🧪 Running Automated Tests

To run the Vitest test suite for similarity, patentability, auth, and reviews:

```bash
cd server
npm test
```

---

## 📁 Project Structure

```text
├── client/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components & SVG icons
│   │   ├── pages/          # Projects, Reviews, Ideas, Leaderboard pages
│   │   ├── context/        # Authentication & global application state
│   │   └── utils/          # Random data test generator
├── server/                 # Express REST API backend
│   ├── controllers/        # Route controllers (projects, reviews, similarity)
│   ├── services/           # AI originality, patentability & review logic
│   ├── database/           # PostgreSQL migrations & seed data
│   ├── infrastructure/     # Vector similarity engine & text vectorizer
│   └── tests/              # Vitest automated test suite
└── package.json            # Root workspace scripts
```

---

## 📄 License
This project is licensed under the MIT License.
