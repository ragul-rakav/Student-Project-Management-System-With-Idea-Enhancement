const { IQueueService } = require('../domain/interfaces');

class AsyncWorkerQueueService extends IQueueService {
  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.activeWorkers = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  async enqueueEmbeddingJob(jobData) {
    this.queue.push({
      id: Date.now() + Math.random(),
      type: 'EMBEDDING_GENERATE',
      data: jobData,
      attempts: 0,
      maxRetries: 3
    });
    this._processNext();
  }

  async _processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.activeWorkers++;

    try {
      if (job.data && typeof job.data.handler === 'function') {
        await job.data.handler(job.data);
      }
    } catch (err) {
      console.error(`❌ Background queue job failed (Attempt ${job.attempts + 1}):`, err.message);
      if (job.attempts < job.maxRetries) {
        job.attempts++;
        this.queue.push(job);
      }
    } finally {
      this.activeWorkers--;
      this._processNext();
    }
  }
}

class QueueServiceFactory {
  static createQueue() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const { Queue } = require('bullmq');
        const IORedis = require('ioredis');
        const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
        console.log('⚡ Background Queue: BullMQ with Redis connected');
        const bullQueue = new Queue('projectpulse-embeddings', { connection });
        return {
          enqueueEmbeddingJob: async (jobData) => {
            await bullQueue.add('generate-embedding', jobData, {
              attempts: 3,
              backoff: { type: 'exponential', delay: 1000 }
            });
          }
        };
      } catch (err) {
        console.warn('BullMQ init error, falling back to AsyncWorkerQueue:', err.message);
      }
    }

    // Resilient In-Process Queue Fallback
    return new AsyncWorkerQueueService(3);
  }
}

module.exports = {
  AsyncWorkerQueueService,
  QueueServiceFactory
};
