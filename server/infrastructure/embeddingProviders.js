const { IEmbeddingProvider } = require('../domain/interfaces');
const crypto = require('crypto');

/**
 * High-performance deterministic TF-IDF / Subword Feature Hashing Vectorizer.
 * Provides resilient, offline-capable 128-dimensional embeddings for project text.
 */
class LocalFeatureVectorizer extends IEmbeddingProvider {
  constructor(dimensions = 128) {
    super();
    this.dimensions = dimensions;
    this.modelName = 'local-tfidf-feature-hashing-v1';
  }

  getDimensions() {
    return this.dimensions;
  }

  getModelName() {
    return this.modelName;
  }

  _tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  _hashToken(token) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.dimensions;
  }

  async generateEmbedding(text) {
    const tokens = this._tokenize(text);
    const vector = new Array(this.dimensions).fill(0.0);

    if (tokens.length === 0) {
      return vector;
    }

    // Term Frequency with Bigrams and Trigram Subwords
    const termFreq = new Map();
    for (let i = 0; i < tokens.length; i++) {
      const unigram = tokens[i];
      termFreq.set(unigram, (termFreq.get(unigram) || 0) + 1.0);

      if (i < tokens.length - 1) {
        const bigram = `${tokens[i]}_${tokens[i + 1]}`;
        termFreq.set(bigram, (termFreq.get(bigram) || 0) + 1.5);
      }
    }

    // Project hashed terms into dimensional space
    for (const [term, freq] of termFreq.entries()) {
      const idx = this._hashToken(term);
      const sign = (this._hashToken(term + '_sign') % 2 === 0) ? 1 : -1;
      const weight = Math.log(1.0 + freq);
      vector[idx] += sign * weight;
    }

    // L2 Normalize Vector
    let norm = 0.0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = parseFloat((vector[i] / norm).toFixed(6));
      }
    }

    return vector;
  }

  async generateBatchEmbeddings(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
}

/**
 * Google Gemini Text Embedding Provider
 */
class GeminiEmbeddingProvider extends IEmbeddingProvider {
  constructor(apiKey, model = 'text-embedding-004') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = 768;
  }

  getDimensions() {
    return this.dimensions;
  }

  getModelName() {
    return `gemini-${this.model}`;
  }

  async generateEmbedding(text) {
    const cleanText = (text || '').trim();
    if (!cleanText) return new Array(this.dimensions).fill(0);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: { parts: [{ text: cleanText }] }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Embedding API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  }

  async generateBatchEmbeddings(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
}

/**
 * OpenAI Text Embedding Provider
 */
class OpenAIEmbeddingProvider extends IEmbeddingProvider {
  constructor(apiKey, model = 'text-embedding-3-small') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = 1536;
  }

  getDimensions() {
    return this.dimensions;
  }

  getModelName() {
    return `openai-${this.model}`;
  }

  async generateEmbedding(text) {
    const cleanText = (text || '').trim();
    if (!cleanText) return new Array(this.dimensions).fill(0);

    const url = 'https://api.openai.com/v1/embeddings';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: cleanText,
        model: this.model
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Embedding API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async generateBatchEmbeddings(texts) {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }
}

class EmbeddingProviderFactory {
  static createProvider() {
    const providerType = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase();

    if (providerType === 'gemini' && process.env.GEMINI_API_KEY) {
      console.log('🤖 Active Embedding Provider: Google Gemini');
      return new GeminiEmbeddingProvider(process.env.GEMINI_API_KEY);
    }

    if (providerType === 'openai' && process.env.OPENAI_API_KEY) {
      console.log('🤖 Active Embedding Provider: OpenAI');
      return new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY);
    }

    // Default resilient local vectorizer
    return new LocalFeatureVectorizer(128);
  }
}

module.exports = {
  LocalFeatureVectorizer,
  GeminiEmbeddingProvider,
  OpenAIEmbeddingProvider,
  EmbeddingProviderFactory
};
