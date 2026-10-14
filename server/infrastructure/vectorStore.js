const { IVectorStore } = require('../domain/interfaces');
const db = require('../config/db');

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

class HybridVectorStore extends IVectorStore {
  constructor() {
    super();
    this.memoryCache = new Map(); // submissionId -> { vector, metadata }
  }

  async saveEmbedding(submissionId, projectId, vector, contentHash, modelName = 'local-tfidf') {
    // 1. Save to in-memory cache
    this.memoryCache.set(submissionId, {
      submissionId,
      projectId,
      vector,
      contentHash,
      modelName
    });

    // 2. Persist to PostgreSQL if connected
    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `INSERT INTO submission_embeddings (submission_id, project_id, model_name, dimensions, embedding_vector, content_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [submissionId, projectId, modelName, vector.length, vector, contentHash]
        );
      } catch (err) {
        console.warn('Postgres saveEmbedding warning:', err.message);
      }
    }
  }

  async loadAllEmbeddings() {
    if (!db.isPgConnected()) return Array.from(this.memoryCache.values());

    try {
      const res = await db.pool.query(`
        SELECT se.submission_id, se.project_id, se.embedding_vector, se.content_hash, se.model_name,
               s.title, s.student_name, s.student_dept, s.category, s.status, s.type, s.abstract, s.tech_stack, s.created_at
        FROM submission_embeddings se
        JOIN submissions s ON s.id = se.submission_id
      `);

      for (const row of res.rows) {
        this.memoryCache.set(row.submission_id, {
          submissionId: row.submission_id,
          projectId: row.project_id,
          vector: row.embedding_vector,
          contentHash: row.content_hash,
          modelName: row.model_name,
          metadata: {
            title: row.title,
            studentName: row.student_name,
            studentDept: row.student_dept,
            category: row.category,
            status: row.status,
            type: row.type,
            abstract: row.abstract,
            techStack: row.tech_stack,
            createdAt: row.created_at
          }
        });
      }
    } catch (err) {
      console.warn('loadAllEmbeddings warning:', err.message);
    }

    return Array.from(this.memoryCache.values());
  }

  async findNearest(queryVector, topK = 5, minThreshold = 0.15, excludeSubmissionId = null) {
    // Ensure all embeddings are in memory cache
    if (this.memoryCache.size === 0 && db.isPgConnected()) {
      await this.loadAllEmbeddings();
    }

    const results = [];

    for (const item of this.memoryCache.values()) {
      if (excludeSubmissionId && item.submissionId === excludeSubmissionId) {
        continue;
      }

      const sim = cosineSimilarity(queryVector, item.vector);
      if (sim >= minThreshold) {
        results.push({
          submissionId: item.submissionId,
          projectId: item.projectId,
          similarity: parseFloat(sim.toFixed(4)),
          metadata: item.metadata || {}
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }
}

module.exports = {
  HybridVectorStore,
  cosineSimilarity
};
