// Realistic academic mock data generator for testing across all domains

const projectTemplates = [
  {
    title: 'Distributed Federated Learning for Privacy-Preserving Hospital Diagnostics',
    category: 'Machine Learning',
    tech: 'Python, PyTorch, Flower FL, FastAPI, Docker, WebSockets',
    abstract: 'A privacy-preserving distributed machine learning framework enabling multiple university health centers to collaboratively train oncology diagnosis models without centralizing patient EHR data.',
    problemStatement: 'Cross-institutional medical research is hindered by stringent data governance (HIPAA/GDPR), preventing collaborative model training on sensitive histopathology scans.',
    objectives: 'Implement differential privacy budgeting (epsilon < 2.5), achieve 94.2% test accuracy on chest X-rays, and demonstrate 40% reduction in gradient communication bandwidth.',
    methodology: 'Federated Averaging (FedAvg) with homomorphic encryption of weight updates, deployed across containerized nodes communicating via asynchronous WebSockets.',
    github: 'https://github.com/academic-research/federated-clinical-ml',
    doc: 'https://docs.google.com/document/d/federated-clinical-ml-spec',
    ppt: 'https://docs.google.com/presentation/d/federated-clinical-ml-slides',
    demo: 'https://youtube.com/watch?v=fed-ml-demo-test',
    vercel: 'https://federated-health-node.vercel.app'
  },
  {
    title: 'Autonomous Multi-Sensor Drone Swarm for Agricultural Yield Optimization',
    category: 'Internet of Things',
    tech: 'Embedded C++, ROS2, ESP32, LoRaWAN, Python, OpenCV',
    abstract: 'An autonomous mesh-networked drone cluster utilizing multispectral imaging and ultrasonic soil sensors to map crop hydration stress and detect early stage pest infestations across university farms.',
    problemStatement: 'Manual agricultural crop surveying is labor-intensive and fails to catch localized drought stress before widespread vegetation loss occurs.',
    objectives: 'Build 3 coordinated micro-UAV nodes with decentralized flocking algorithms, stream normalized difference vegetation index (NDVI) telemetry via LoRa, and achieve sub-meter waypoint accuracy.',
    methodology: 'ROS2 micro-controller nodes with decentralized Reynolds flocking rules, edge inference on Raspberry Pi Zero 2W, and base station telemetry telemetry logging.',
    github: 'https://github.com/campus-agritech/drone-swarm-mesh',
    doc: 'https://docs.google.com/document/d/agri-drone-swarm-report',
    ppt: 'https://docs.google.com/presentation/d/agri-drone-swarm-deck',
    demo: 'https://youtube.com/watch?v=drone-swarm-agri-test',
    vercel: 'https://agri-swarm-monitor.vercel.app'
  },
  {
    title: 'Zero-Knowledge Credential Verification Protocol for Academic Diplomas',
    category: 'Blockchain',
    tech: 'Solidity, Circom, SnarkJS, Next.js, Ethers.js, IPFS',
    abstract: 'A privacy-first verifiable credentials system enabling students to cryptographically prove graduation honors and GPA thresholds to employers without revealing complete transcripts or personally identifiable information.',
    problemStatement: 'Diploma fraud costs institutions millions annually, while existing online verification systems compromise student transcript privacy and leak sensitive personal data.',
    objectives: 'Deploy Groth16 zero-knowledge zk-SNARK circuits on Ethereum testnet, establish gas-optimized registry contracts, and generate mobile wallet proofs in under 1.5 seconds.',
    methodology: 'Circom arithmetic constraint circuits compiled into R1CS, verification contracts on Polygon Mumbai, and encrypted IPFS credential anchors.',
    github: 'https://github.com/verifiable-academic/zk-diploma-proofs',
    doc: 'https://docs.google.com/document/d/zk-diploma-whitepaper',
    ppt: 'https://docs.google.com/presentation/d/zk-diploma-pres',
    demo: 'https://youtube.com/watch?v=zk-diploma-demo',
    vercel: 'https://zk-credentials-vault.vercel.app'
  },
  {
    title: 'Adaptive Real-Time DDoS Detection via Graph Neural Networks',
    category: 'Cybersecurity',
    tech: 'Python, PyTorch Geometric, eBPF, Kafka, Go, Grafana',
    abstract: 'High-throughput software-defined network intrusion defense system that models packet flow graphs in real time using eBPF kernel hooks to quarantine zero-day amplification attacks before switch saturation.',
    problemStatement: 'Traditional signature-based firewall inspection suffers from unacceptable latency under multi-terabit volumetric botnet attacks.',
    objectives: 'Intercept packet headers at wire speed using Linux eBPF, classify temporal graph topology with 99.1% F1-score, and execute automated BGP Flowspec drop rules in under 350ms.',
    methodology: 'Kernel-space eBPF XDP programs extract IP flow 5-tuples into a streaming ring buffer; graph convolutional networks evaluate node centrality anomalies in 5-second sliding windows.',
    github: 'https://github.com/network-defense-lab/ebpf-gnn-shield',
    doc: 'https://docs.google.com/document/d/ebpf-gnn-security-report',
    ppt: 'https://docs.google.com/presentation/d/ebpf-gnn-presentation',
    demo: 'https://youtube.com/watch?v=ebpf-gnn-mitigation',
    vercel: 'https://ebpf-shield-dashboard.vercel.app'
  },
  {
    title: 'Offline-First Progressive Web Platform for Disaster Relief Coordination',
    category: 'Web Development',
    tech: 'TypeScript, React, IndexedDB, WebRTC, Tailwind, Workbox PWA',
    abstract: 'A zero-bandwidth mesh collaboration platform enabling civilian emergency volunteers and rescue teams to coordinate supply requests and shelter capacity during grid outages via browser-to-browser WebRTC data channels.',
    problemStatement: 'Severe weather disasters regularly disable cellular base stations, leaving local emergency response disconnected from centralized cloud servers.',
    objectives: 'Achieve complete offline CRUD persistence via IndexedDB, enable peer-to-peer data sync between nearby smartphones without cellular towers, and maintain battery efficiency below 4% per hour.',
    methodology: 'Conflict-free Replicated Data Types (CRDTs) synchronized over WebRTC data channels, service worker background sync, and cryptographic offline message signing.',
    github: 'https://github.com/disaster-response-mesh/relief-pwa',
    doc: 'https://docs.google.com/document/d/relief-mesh-pwa-docs',
    ppt: 'https://docs.google.com/presentation/d/relief-mesh-pwa-slides',
    demo: 'https://youtube.com/watch?v=relief-pwa-demo',
    vercel: 'https://mesh-relief-coordinator.vercel.app'
  }
];

const ideaTemplates = [
  {
    title: 'Campus Micro-Grid Smart Energy Exchange with Dynamic Peer-to-Peer Pricing',
    tags: 'IoT, Blockchain, CleanTech, SmartGrids',
    description: 'An open-source energy ledger enabling university hostel blocks with rooftop solar panels to automatically auction surplus electricity to engineering laboratories during peak tariff hours, lowering campus carbon emissions.'
  },
  {
    title: 'Voice-Assisted AI IDE Extension for Visually Impaired Software Engineers',
    tags: 'Accessibility, AI, VSCode, AudioSynthesizer',
    description: 'An intelligent IDE plugin converting AST syntax tree navigation and indentation hierarchies into spatial binaural acoustic cues, allowing blind programmers to debug complex recursive algorithms hands-free.'
  },
  {
    title: 'Sub-Surface Acoustic Leak Detection Node for Campus Water Pipelines',
    tags: 'Acoustics, IoT, EdgeML, Sustainability',
    description: 'Low-cost piezoelectric vibration sensors clamped onto underground municipal pipeline junctions that run edge spectrogram classification to isolate hairline pipe bursts before sinkholes develop.'
  }
];

const enhancementTemplates = [
  {
    title: 'Add ONNX Runtime Edge Quantization to Reduce Latency by 65%',
    details: 'Proposed optimizing the existing PyTorch inference pipeline by quantizing model weights from FP32 to INT8 and compiling with ONNX Runtime. Benchmarks indicate memory footprint drops from 480MB to 125MB with zero loss in classification F1-score.',
    link: 'https://github.com/projectpulse-contrib/edge-quantization-pr'
  },
  {
    title: 'Migrate State Management to TanStack Query with IndexedDB Offline Cache',
    details: 'Replace current polling cycle with TanStack Query optimistic updates and persistent IndexedDB storage, eliminating redundant server network calls on dashboard load and enabling complete offline viewing.',
    link: 'https://github.com/projectpulse-contrib/offline-cache-enhancement'
  }
];

const studentTemplates = [
  { name: 'Swetha Ramachandran', email: 'swetha.r@university.edu', dept: 'Computer Science', year: 'Third Year' },
  { name: 'Arunmozhi Varman', email: 'arunmozhi.v@university.edu', dept: 'Information Technology', year: 'Final Year' },
  { name: 'Thamarai Selvi', email: 'thamarai.s@university.edu', dept: 'Electronics', year: 'Second Year' },
  { name: 'Mukilan Ezhil', email: 'mukilan.e@university.edu', dept: 'Computer Science', year: 'First Year' }
];

export function getRandomProject() {
  const index = Math.floor(Math.random() * projectTemplates.length);
  return projectTemplates[index];
}

export function getRandomIdea() {
  const index = Math.floor(Math.random() * ideaTemplates.length);
  return ideaTemplates[index];
}

export function getRandomEnhancement() {
  const index = Math.floor(Math.random() * enhancementTemplates.length);
  return enhancementTemplates[index];
}

export function getRandomStudent() {
  const index = Math.floor(Math.random() * studentTemplates.length);
  const student = studentTemplates[index];
  return {
    ...student,
    password: 'Password@123'
  };
}

export function getRandomReport() {
  return {
    category: 'Plagiarism / Copyright',
    reason: 'Identified 80% verbatim code similarity with public IEEE student repository 2024. The hardware circuit diagram in Section 3 and abstract text appear copied without citation.'
  };
}

export function getRandomReviewDecision() {
  return {
    comments: 'Strong architectural proposal with clear methodology. System design demonstrates genuine academic rigor. Recommended to expand on empirical error bounds and hardware tolerance benchmarks in final presentation.',
    rejectionReason: 'Scope lacks technical novelty compared to prior department repositories. Please revise to incorporate verifiable evaluation metrics.'
  };
}
