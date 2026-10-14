/**
 * ProjectPulse Domain Interfaces & Contracts (SOLID: Interface Segregation)
 */

class IEmbeddingProvider {
  /**
   * Generates a vector embedding for the given input text.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    throw new Error('generateEmbedding must be implemented');
  }

  /**
   * Generates vector embeddings for a batch of input texts.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async generateBatchEmbeddings(texts) {
    throw new Error('generateBatchEmbeddings must be implemented');
  }

  getDimensions() {
    throw new Error('getDimensions must be implemented');
  }

  getModelName() {
    throw new Error('getModelName must be implemented');
  }
}

class IVectorStore {
  /**
   * Saves an embedding vector for a submission.
   * @param {number} submissionId
   * @param {number|null} projectId
   * @param {number[]} vector
   * @param {string} contentHash
   * @returns {Promise<void>}
   */
  async saveEmbedding(submissionId, projectId, vector, contentHash) {
    throw new Error('saveEmbedding must be implemented');
  }

  /**
   * Searches for top-K nearest neighbors.
   * @param {number[]} vector
   * @param {number} topK
   * @param {number} minThreshold
   * @param {number|null} excludeSubmissionId
   * @returns {Promise<Array<{ submissionId: number, projectId: number, similarity: number, metadata: object }>>}
   */
  async findNearest(vector, topK = 5, minThreshold = 0.2, excludeSubmissionId = null) {
    throw new Error('findNearest must be implemented');
  }
}

class IQueueService {
  /**
   * Enqueues an asynchronous embedding generation job.
   * @param {object} jobData
   * @returns {Promise<void>}
   */
  async enqueueEmbeddingJob(jobData) {
    throw new Error('enqueueEmbeddingJob must be implemented');
  }
}

module.exports = {
  IEmbeddingProvider,
  IVectorStore,
  IQueueService
};
