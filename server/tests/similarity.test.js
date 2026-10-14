import { describe, it, expect, beforeAll } from 'vitest';
const { similarityService } = require('../services/similarityService');
const { LocalFeatureVectorizer } = require('../infrastructure/embeddingProviders');
const { cosineSimilarity } = require('../infrastructure/vectorStore');

describe('ProjectPulse AI Similarity & Originality Engine', () => {
  let vectorizer;

  beforeAll(async () => {
    vectorizer = new LocalFeatureVectorizer(128);
    await similarityService.initialize();
  });

  it('generates normalized 128-dimensional embeddings deterministically', async () => {
    const textA = 'Machine learning model for smart campus attendance using facial recognition';
    const vecA1 = await vectorizer.generateEmbedding(textA);
    const vecA2 = await vectorizer.generateEmbedding(textA);

    expect(vecA1.length).toBe(128);
    expect(vecA1).toEqual(vecA2);

    // Verify L2 norm is ~ 1.0
    const norm = Math.sqrt(vecA1.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 2);
  });

  it('measures high cosine similarity for paraphrased/related domain text', async () => {
    const textA = 'Deep learning CNN model for real-time facial recognition and student attendance';
    const textB = 'AI face detection neural network automated classroom attendance tracking system';
    const textC = 'Autonomous quadcopter drone obstacle avoidance with LIDAR sensor navigation';

    const vecA = await vectorizer.generateEmbedding(textA);
    const vecB = await vectorizer.generateEmbedding(textB);
    const vecC = await vectorizer.generateEmbedding(textC);

    const simAB = cosineSimilarity(vecA, vecB);
    const simAC = cosineSimilarity(vecA, vecC);

    expect(simAB).toBeGreaterThan(0.20);
    expect(simAB).toBeGreaterThan(simAC);
  });

  it('flags direct duplicates when a submission is identical to an existing project', async () => {
    const duplicateSubmission = {
      title: 'AI-Powered Attendance System',
      category: 'Machine Learning',
      abstract: 'An automated attendance management system using facial recognition to track student presence in classes. Built using Python, OpenCV, and Flask.',
      tech: ['Python', 'OpenCV', 'Flask']
    };

    const report = await similarityService.analyzeOriginality(duplicateSubmission);

    expect(report.isDirectDuplicate).toBe(true);
    expect(report.similarityScore).toBeGreaterThanOrEqual(80.0);
    expect(report.originalityScore).toBeLessThanOrEqual(20.0);
    expect(report.riskLevel).toContain('Duplicate');
    expect(report.matchedProjects.length).toBeGreaterThan(0);
    expect(report.matchedProjects[0].title).toBe('AI-Powered Attendance System');
  });

  it('detects and flags resubmissions of previously rejected projects with full faculty audit context', async () => {
    // This input targets canonical rejected project #999 ("Smart IoT Waste Bin with Ultrasonic Level Tracking")
    const resubmissionCandidate = {
      title: 'Automated Campus Smart Garbage Bin with Routing Notification',
      category: 'Internet of Things',
      abstract: 'Smart waste bin node using ultrasonic sensors to monitor fill levels in university campus and alert sanitary workers over LoRaWAN network to optimize waste collection routes.',
      tech: ['Arduino', 'C++', 'LoRaWAN', 'Flask'],
      problem_statement: 'Campus garbage overflow leads to sanitary hazards and inefficient manual collection rounds.',
      methodology: 'HC-SR04 ultrasonic sensor with ESP8266 and LoRa gateway dashboard.'
    };

    const report = await similarityService.analyzeOriginality(resubmissionCandidate);

    expect(report.isResubmissionOfRejected).toBe(true);
    expect(report.resubmissionDetails).toBeDefined();
    expect(report.resubmissionDetails.originalRejectingFaculty).toBe('Dr. Arumugam Pillai');
    expect(report.resubmissionDetails.originalFacultyComments).toContain('novelty in hardware design');
    expect(report.resubmissionDetails.similarityScore).toBeGreaterThanOrEqual(45.0);
    expect(report.resubmissionDetails.matchedSections).toBeDefined();
  });

  it('confirms clean originality score for a truly unique and novel project idea', async () => {
    const novelProject = {
      title: 'Exoplanet Atmospheric Spectrometry Analyzer via Neuromorphic Photonic Silicon',
      category: 'Other (Astrophysics Computing)',
      abstract: 'Ultra-low-power neuromorphic hardware accelerator simulating silicon photonics interference patterns to classify spectral biosignatures in James Webb Space Telescope telemetry.',
      tech: ['Verilog', 'Rust', 'WebAssembly', 'OpenCL', 'Astropy']
    };

    const report = await similarityService.analyzeOriginality(novelProject);

    expect(report.isDirectDuplicate).toBe(false);
    expect(report.isResubmissionOfRejected).toBe(false);
    expect(report.originalityScore).toBeGreaterThan(70.0);
    expect(report.riskLevel).toBe('Low');
    expect(report.patentability).toBeDefined();
    expect(report.patentability.isPatentable).toBe(true);
    expect(report.patentability.status).toContain('Patent Eligible');
    expect(report.patentability.justification).toContain('tangible technical character');
  });

  it('evaluates non-patentability with legal justification for routine web/CRUD software', async () => {
    const routineCrudApp = {
      title: 'Online Bookstore and Student Stationery Portal',
      category: 'Web Development',
      abstract: 'A full-stack e-commerce web portal with cart management, user authentication, and stripe payment integration for buying university textbooks.',
      tech: ['React', 'Node.js', 'Express', 'MongoDB', 'CSS']
    };

    const report = await similarityService.analyzeOriginality(routineCrudApp);

    expect(report.patentability).toBeDefined();
    expect(report.patentability.isPatentable).toBe(false);
    expect(report.patentability.status).toContain('Non-Patentable');
    expect(report.patentability.justification).toContain('computer programs');
    expect(Array.isArray(report.patentability.recommendations)).toBe(true);
    expect(report.patentability.recommendations.length).toBeGreaterThan(0);
  });

  it('verifies resubmission audit comparison contains prior history and faculty verification checklist', async () => {
    const resubmissionCandidate = {
      title: 'Automated Campus Smart Garbage Bin with Routing Notification',
      category: 'Internet of Things',
      abstract: 'Smart waste bin node using ultrasonic sensors to monitor fill levels in university campus and alert sanitary workers over LoRaWAN network to optimize waste collection routes.',
      tech: ['Arduino', 'C++', 'LoRaWAN', 'Flask', 'EdgeAI'],
      problem_statement: 'Campus garbage overflow leads to sanitary hazards and inefficient manual collection rounds.',
      methodology: 'HC-SR04 ultrasonic sensor with ESP8266 and LoRa gateway dashboard.'
    };

    const report = await similarityService.analyzeOriginality(resubmissionCandidate);
    expect(report.resubmissionDetails).toBeDefined();
    expect(report.resubmissionDetails.auditComparison).toBeDefined();
    expect(report.resubmissionDetails.auditComparison.whatWasSubmittedLastTime).toBeDefined();
    expect(report.resubmissionDetails.auditComparison.whyItGotRejected).toContain('Rejected');
    expect(Array.isArray(report.resubmissionDetails.auditComparison.facultyChecklist)).toBe(true);
  });

  it('identifies external Google Patents prior art conflict with clickable patent reference', async () => {
    const iotWasteBin = {
      title: 'Smart Waste Bin Node with Ultrasonic Fill Level Detection',
      category: 'Internet of Things',
      abstract: 'An automated IoT waste collection node utilizing ultrasonic distance sensors, low-power LoRa transceivers, and routing optimization algorithms to alert municipal sanitation crews.',
      tech: ['Arduino', 'LoRaWAN', 'Ultrasonic HC-SR04', 'Flask']
    };

    const report = await similarityService.analyzeOriginality(iotWasteBin);
    expect(report.patentability).toBeDefined();
    expect(report.patentability.externalPriorArt).toBeDefined();
    expect(report.patentability.externalPriorArt.hasConflict).toBe(true);
    expect(report.patentability.externalPriorArt.conflictingId).toBe('US10872295B2');
    expect(report.patentability.externalPriorArt.googlePatentsUrl).toContain('patents.google.com');
  });

  it('dynamically generates 1-2 unapplied enhancements for low-originality submissions and none for original projects', async () => {
    const lowOriginalitySubmission = {
      title: 'AI Attendance System with Camera',
      category: 'Machine Learning',
      abstract: 'Facial recognition attendance for classroom presence.',
      tech: ['Python', 'OpenCV']
    };

    const reportLow = await similarityService.analyzeOriginality(lowOriginalitySubmission);
    expect(reportLow.enhancementSuggestions).toBeDefined();
    expect(reportLow.enhancementSuggestions.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(reportLow.enhancementSuggestions.recommendations.length).toBeLessThanOrEqual(3);

    // Apply the first suggestion to the project
    const appliedSug = reportLow.enhancementSuggestions.recommendations[0];
    const updatedSubmission = {
      ...lowOriginalitySubmission,
      abstract: `${lowOriginalitySubmission.abstract} ${appliedSug.description}`,
      tech: [...lowOriginalitySubmission.tech, appliedSug.techAddition]
    };

    // Re-check: the applied suggestion must NOT appear again in suggestions
    const reportRechecked = await similarityService.analyzeOriginality(updatedSubmission);
    const recheckedIds = reportRechecked.enhancementSuggestions.recommendations.map(r => r.id);
    expect(recheckedIds).not.toContain(appliedSug.id);

    // Highly original submission (originality >= 60%) must get 0 enhancement suggestions
    const highOriginalitySubmission = {
      title: 'Quantum Gravitational Lensing Simulation in Neuromorphic Silicon Photonics',
      category: 'Quantum Computing',
      abstract: 'Novel photonic mesh simulator for general relativistic gravitational lensing models.',
      tech: ['Qiskit', 'Rust', 'WebAssembly', 'Verilog']
    };

    const reportHigh = await similarityService.analyzeOriginality(highOriginalitySubmission);
    expect(reportHigh.originalityScore).toBeGreaterThanOrEqual(60.0);
    expect(reportHigh.enhancementSuggestions.recommendations.length).toBe(0);
  });
});

