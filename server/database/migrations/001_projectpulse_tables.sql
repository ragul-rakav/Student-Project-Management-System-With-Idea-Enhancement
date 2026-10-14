-- ProjectPulse Schema Extensions
-- Tables for AI Similarity Detection, Vector Embeddings, Immutable Submissions, and Rejected Resubmission Audit Trails

-- 1. Try enabling pgvector if available in PG environment
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension binary not found in environment; using native FLOAT8[] cosine similarity fallback.';
END $$;

-- 2. Immutable Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    project_id INT, -- Not constrained to allow submissions before repository approval
    student_id INT REFERENCES users(id) ON DELETE SET NULL,
    student_name VARCHAR(255) NOT NULL,
    student_dept VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    abstract TEXT NOT NULL,
    problem_statement TEXT,
    objectives TEXT,
    methodology TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    github_url TEXT,
    doc_url TEXT,
    ppt_url TEXT,
    cert_url TEXT,
    demo_url TEXT,
    vercel_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected', 'Changes Requested')),
    originality_score FLOAT DEFAULT 100.0,
    similarity_score FLOAT DEFAULT 0.0,
    is_resubmission_of_rejected BOOLEAN DEFAULT FALSE,
    flagged_rejected_submission_id INT,
    assigned_faculty VARCHAR(255),
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_project_id_fkey;

-- 3. Embeddings Storage Table
CREATE TABLE IF NOT EXISTS submission_embeddings (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    project_id INT,
    model_name VARCHAR(100) NOT NULL,
    dimensions INT NOT NULL,
    embedding_vector FLOAT8[] NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE submission_embeddings DROP CONSTRAINT IF EXISTS submission_embeddings_project_id_fkey;

-- 4. Immutable Review Decisions & Audit Trail
CREATE TABLE IF NOT EXISTS review_decisions (
    id SERIAL PRIMARY KEY,
    submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    project_id INT,
    reviewer_id INT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('Approved', 'Rejected', 'Changes Requested')),
    rejection_reason VARCHAR(255),
    faculty_comments TEXT,
    similarity_snapshot JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rejected Resubmission Flags & Audit Links
CREATE TABLE IF NOT EXISTS rejected_resubmission_flags (
    id SERIAL PRIMARY KEY,
    current_submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    prior_rejected_submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    matched_sections JSONB,
    original_rejecting_faculty VARCHAR(255) NOT NULL,
    original_rejection_date TIMESTAMP NOT NULL,
    original_rejection_reason VARCHAR(255) NOT NULL,
    original_faculty_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Refresh Tokens for Secure HttpOnly Cookie Rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_submissions_faculty ON submissions(assigned_faculty);
CREATE INDEX IF NOT EXISTS idx_submissions_proj ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_sub ON review_decisions(submission_id);
CREATE INDEX IF NOT EXISTS idx_decisions_proj ON review_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_reviewer ON review_decisions(reviewer_name);
CREATE INDEX IF NOT EXISTS idx_embeddings_sub ON submission_embeddings(submission_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_proj ON submission_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_resubmission_flags_curr ON rejected_resubmission_flags(current_submission_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
