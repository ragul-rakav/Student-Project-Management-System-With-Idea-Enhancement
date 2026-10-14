const db = require('../config/db');

// Predefined platform domains
const predefinedDomains = [
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'Blockchain',
  'Internet of Things',
  'Cybersecurity',
  'Cloud Computing'
];

// In-Memory store populated with Tamil student & faculty datasets
let users = [
  // STUDENTS (Authentic Tamil Names)
  {
    id: 1, name: 'Kavitha Sundaram', email: 'kavitha@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Final Year', credits: 85, approved_projects: 3, skills: ['React Native', 'Node.js', 'AWS', 'Python'], domain_of_interest: 'Machine Learning', initials: 'KS', creditHistory: [
      { id: 1, title: 'Project Approved: Autonomous Swarm Robotics Controller', points: 25, date: '2026-07-25', type: 'approval' },
      { id: 2, title: 'Project Approved: Quantum-Safe Encryption Protocol', points: 20, date: '2026-07-20', type: 'approval' },
      { id: 3, title: 'Project Approved: Global Decentralized Healthcare Ledger', points: 20, date: '2026-07-15', type: 'approval' },
      { id: 4, title: 'Community Enhancement Contribution', points: 10, date: '2026-07-10', type: 'enhancement' },
      { id: 5, title: 'Published Verified Project Idea', points: 10, date: '2026-07-05', type: 'idea' }
    ]
  },
  {
    id: 2, name: 'Karthik Raja', email: 'karthik@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Final Year', credits: 215, approved_projects: 8, skills: ['Java', 'Spring Boot', 'SQL', 'Docker'], domain_of_interest: 'Cloud Computing', initials: 'KR', creditHistory: [
      { id: 1, title: 'Project Approved: Campus Marketplace App', points: 20, date: '2026-07-26', type: 'approval' },
      { id: 2, title: 'Project Approved: Microservice Gateway', points: 15, date: '2026-07-18', type: 'approval' },
      { id: 3, title: 'Community Enhancement Contribution', points: 10, date: '2026-07-12', type: 'enhancement' }
    ]
  },
  {
    id: 3, name: 'Ananya Selvam', email: 'ananya@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Third Year', credits: 190, approved_projects: 9, skills: ['React', 'Node.js', 'Python', 'Flask'], domain_of_interest: 'Machine Learning', initials: 'AS', creditHistory: [
      { id: 1, title: 'Project Approved: AI-Powered Attendance System', points: 20, date: '2026-07-28', type: 'approval' },
      { id: 2, title: 'Peer Collaboration Merged', points: 10, date: '2026-07-22', type: 'collab' },
      { id: 3, title: 'Published Verified Project Idea', points: 5, date: '2026-07-14', type: 'idea' }
    ]
  },
  {
    id: 4, name: 'Kavin Kumar', email: 'kavin@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Final Year', credits: 168, approved_projects: 7, skills: ['Angular', 'TypeScript', 'Node.js', 'Moodle'], domain_of_interest: 'Web Development', initials: 'KK', creditHistory: [
      { id: 1, title: 'Project Approved: Open Source LMS Plugin', points: 20, date: '2026-07-27', type: 'approval' },
      { id: 2, title: 'Community Enhancement Contribution', points: 10, date: '2026-07-19', type: 'enhancement' }
    ]
  },
  {
    id: 5, name: 'Priya Senthil', email: 'priya@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Information Technology', academic_year: 'Third Year', credits: 155, approved_projects: 6, skills: ['Flutter', 'Dart', 'Firebase', 'Google Maps'], domain_of_interest: 'Mobile Development', initials: 'PS', creditHistory: [
      { id: 1, title: 'Project Approved: Smart Campus Navigation', points: 20, date: '2026-07-24', type: 'approval' },
      { id: 2, title: 'Peer Collaboration Merged', points: 10, date: '2026-07-16', type: 'collab' }
    ]
  },
  {
    id: 6, name: 'Dhanush Ram', email: 'dhanush@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Electronics', academic_year: 'Second Year', credits: 142, approved_projects: 5, skills: ['C++', 'Arduino', 'Raspberry Pi', 'LoRaWAN'], domain_of_interest: 'Internet of Things', initials: 'DR', creditHistory: [
      { id: 1, title: 'Published Verified Project Idea: IoT Waste Management Sensor', points: 15, date: '2026-07-21', type: 'idea' }
    ]
  },
  {
    id: 7, name: 'Nithya Raman', email: 'nithya@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Third Year', credits: 138, approved_projects: 6, skills: ['Python', 'PyTorch', 'NLTK', 'FastAPI'], domain_of_interest: 'Machine Learning', initials: 'NR', creditHistory: [
      { id: 1, title: 'Published Verified Project Idea: AI Study Buddy Chatbot', points: 10, date: '2026-07-23', type: 'idea' }
    ]
  },
  {
    id: 8, name: 'Vignesh Kanna', email: 'vignesh@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Electronics', academic_year: 'Third Year', credits: 172, approved_projects: 7, skills: ['VHDL', 'Verilog', 'Embedded C', 'C++'], domain_of_interest: 'Internet of Things', initials: 'VK', creditHistory: [
      { id: 1, title: 'Project Approved: Smart Energy Meter Node', points: 20, date: '2026-07-25', type: 'approval' }
    ]
  },
  {
    id: 9, name: 'Soundarya Devi', email: 'soundarya@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Information Technology', academic_year: 'Third Year', credits: 130, approved_projects: 4, skills: ['React', 'Tailwind', 'Node.js'], domain_of_interest: 'Web Development', initials: 'SD', creditHistory: [
      { id: 1, title: 'Project Approved: Student Portal Redesign', points: 15, date: '2026-07-20', type: 'approval' }
    ]
  },
  {
    id: 10, name: 'Aravind Swamy', email: 'aravind@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Computer Science', academic_year: 'Second Year', credits: 120, approved_projects: 4, skills: ['Python', 'Django', 'PostgreSQL'], domain_of_interest: 'Cybersecurity', initials: 'AS', creditHistory: [
      { id: 1, title: 'Project Approved: Vulnerability Scanner', points: 15, date: '2026-07-19', type: 'approval' }
    ]
  },
  {
    id: 11, name: 'Meenakshi Natarajan', email: 'meenakshi@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Information Technology', academic_year: 'Second Year', credits: 110, approved_projects: 3, skills: ['Swift', 'iOS', 'Firebase'], domain_of_interest: 'Mobile Development', initials: 'MN', creditHistory: [
      { id: 1, title: 'Project Approved: Campus Event Guide iOS App', points: 15, date: '2026-07-17', type: 'approval' }
    ]
  },
  {
    id: 12, name: 'Suriya Prakash', email: 'suriya@university.edu', password: 'password', role: 'Student', status: 'Active', dept: 'Electronics', academic_year: 'First Year', credits: 95, approved_projects: 2, skills: ['C', 'Arduino', 'Sensors'], domain_of_interest: 'Internet of Things', initials: 'SP', creditHistory: [
      { id: 1, title: 'Project Approved: Automated Plant Watering Sensor', points: 15, date: '2026-07-12', type: 'approval' }
    ]
  },

  // FACULTY (Strict 3 Testing Faculty Accounts)
  { id: 13, name: 'Dr. Arumugam Pillai', email: 'arumugam@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Computer Science', academic_year: 'Senior Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Machine Learning', specializations: ['Machine Learning', 'Cloud Computing', 'Blockchain'], maxPendingThreshold: 999, initials: 'AP' },
  { id: 14, name: 'Dr. Senthamizhan V', email: 'senthamizhan@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Computer Science', academic_year: 'Associate Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Web Development', specializations: ['Web Development', 'Cybersecurity'], maxPendingThreshold: 999, initials: 'SV' },
  { id: 15, name: 'Dr. Thenmozhi K', email: 'thenmozhi@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Information Technology', academic_year: 'Associate Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Mobile Development', specializations: ['Mobile Development', 'Internet of Things', 'Other'], maxPendingThreshold: 999, initials: 'TK' },
  { id: 16, name: 'Dr. Kabilan Pandian', email: 'kabilan@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Computer Science', academic_year: 'Assistant Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Blockchain', specializations: ['Blockchain', 'Machine Learning', 'Cloud Computing'], maxPendingThreshold: 10, initials: 'KP' },
  { id: 17, name: 'Dr. Rajeswari Velu', email: 'rajeswari@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Information Technology', academic_year: 'Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Cloud Computing', specializations: ['Cloud Computing', 'Web Development', 'Internet of Things'], maxPendingThreshold: 10, initials: 'RV' },
  { id: 18, name: 'Dr. Muruganandam S', email: 'muruganandam@university.edu', password: 'password', role: 'Faculty', status: 'Active', dept: 'Electronics', academic_year: 'Professor', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'Internet of Things', specializations: ['Internet of Things', 'Mobile Development', 'Blockchain'], maxPendingThreshold: 10, initials: 'MS' },

  // ADMIN USER
  { id: 19, name: 'Admin User', email: 'admin@university.edu', password: 'password', role: 'Administrator', status: 'Active', dept: 'Platform Governance', academic_year: 'Head Administrator', credits: 0, approved_projects: 0, skills: [], domain_of_interest: 'All Domains', specializations: predefinedDomains, maxPendingThreshold: 999, initials: 'AU' }
];

let projects = [
  {
    id: 1, type: 'Internal', status: 'Approved', title: 'AI-Powered Attendance System', author: 'Ananya Selvam', dept: 'Computer Science', category: 'Machine Learning', likes: 42, commentsCount: 2, views: 315, clones: 24, liked: false,
    abstract: 'An automated attendance management system using facial recognition to track student presence in classes. Built using Python, OpenCV, and Flask.',
    github: 'https://github.com/ananya/ai-attendance', doc: 'https://docs.google.com/document/d/1attendance', ppt: 'https://docs.google.com/presentation/d/1attendance-ppt', demo: 'https://youtube.com/watch?v=attendance-demo', vercel: 'https://ai-attendance.vercel.app',
    tech: ['Python', 'OpenCV', 'Flask'], collaborators: ['Priya Senthil', 'Nithya Raman'], assignedFaculty: 'Dr. Arumugam Pillai',
    comments: [
      { id: 1, author: 'Dr. Arumugam Pillai', text: 'Excellent implementation of face recognition algorithm. Accurate and fast.', time: '2 days ago' },
      { id: 2, author: 'Priya Senthil', text: 'This is great! I would love to work on extending this to mobile.', time: '1 day ago' }
    ],
    enhancements: []
  },
  {
    id: 2, type: 'Internal', status: 'Approved', title: 'Smart Campus Navigation', author: 'Priya Senthil', dept: 'Information Technology', category: 'Mobile Development', likes: 36, commentsCount: 1, views: 240, clones: 18, liked: false,
    abstract: 'An interactive mobile app providing step-by-step navigation around the campus using beacon technology and custom layouts.',
    github: 'https://github.com/priya/smart-nav', doc: 'https://docs.google.com/document/d/1smart-nav', ppt: 'https://docs.google.com/presentation/d/1smart-nav-ppt', demo: 'https://youtube.com/watch?v=nav-demo', vercel: '',
    tech: ['Flutter', 'Dart', 'Google Maps API'], collaborators: ['Ananya Selvam'], assignedFaculty: 'Dr. Thenmozhi K',
    comments: [
      { id: 3, author: 'Dr. Thenmozhi K', text: 'Very useful utility for freshers. The routing algorithm is quite efficient.', time: '3 days ago' }
    ],
    enhancements: []
  },
  {
    id: 3, type: 'External', status: 'In Review', title: 'Campus Marketplace App', author: 'Karthik Raja', dept: 'Computer Science', category: 'Mobile Development', likes: 28, commentsCount: 0, views: 198, clones: 12, liked: false,
    abstract: 'A marketplace application designed exclusively for university students to buy, sell, or rent textbooks, electronics, and room utilities.',
    github: 'https://github.com/karthik/campus-market', doc: 'https://docs.google.com/document/d/1campus-market', ppt: '', cert: 'https://certs.com/karthik-marketplace', demo: '', vercel: 'https://campus-market.vercel.app',
    tech: ['React Native', 'Node.js', 'MongoDB'], collaborators: ['Kavitha Sundaram'], assignedFaculty: 'Dr. Thenmozhi K', comments: [], enhancements: []
  },
  {
    id: 4, type: 'External', status: 'Approved', title: 'Open Source LMS Plugin', author: 'Kavin Kumar', dept: 'Computer Science', category: 'Web Development', likes: 55, commentsCount: 0, views: 420, clones: 35, liked: false,
    abstract: 'A modular LMS plugin that integrates peer-to-peer coding challenges directly into course modules, supporting interactive feedback.',
    github: 'https://github.com/kavin/lms-plugin', doc: 'https://docs.google.com/document/d/1lms-plugin', ppt: '', cert: 'https://certs.com/kavin-lms', demo: 'https://youtube.com/watch?v=lms-demo', vercel: '',
    tech: ['PHP', 'JavaScript', 'Moodle'], collaborators: [], assignedFaculty: 'Dr. Senthamizhan V', comments: [], enhancements: []
  },
  {
    id: 5, type: 'Idea', status: null, title: 'Blockchain-Based Certificate Verification', author: 'Ananya Selvam', dept: 'Computer Science', category: 'Blockchain', likes: 15, commentsCount: 0, views: 87, clones: 4, liked: false,
    abstract: 'A decentralized verification system ensuring tampering-proof transcripts and degree certificates using smart contracts.',
    github: '', doc: '', ppt: '', demo: '', vercel: '', tech: ['Solidity', 'Ethereum', 'React'], collaborators: [], comments: [], enhancements: []
  },
  {
    id: 6, type: 'Idea', status: null, title: 'IoT Waste Management Sensor', author: 'Dhanush Ram', dept: 'Electronics', category: 'Internet of Things', likes: 22, commentsCount: 0, views: 134, clones: 8, liked: false,
    abstract: 'Smart bin sensor node that alerts the waste management agency when bin capacity is exceeded, optimizing routing schedules.',
    github: '', doc: '', ppt: '', demo: '', vercel: '', tech: ['C++', 'Arduino', 'LoRaWAN'], collaborators: [], comments: [], enhancements: []
  },
  {
    id: 7, type: 'Idea', status: null, title: 'AI Study Buddy Chatbot', author: 'Nithya Raman', dept: 'Computer Science', category: 'Machine Learning', likes: 31, commentsCount: 0, views: 205, clones: 10, liked: false,
    abstract: 'Conversational LLM agent custom-trained on university syllabus to answer students queries and quiz them dynamically.',
    github: '', doc: '', ppt: '', demo: '', vercel: '', tech: ['Python', 'PyTorch', 'NLTK'], collaborators: [], comments: [], enhancements: []
  },
  {
    id: 8, type: 'External', status: 'Approved', title: 'Autonomous Swarm Robotics Controller', author: 'Kavitha Sundaram', dept: 'Computer Science', category: 'Machine Learning', likes: 89, commentsCount: 5, views: 610, clones: 45, liked: false,
    abstract: 'Distributed path planning and obstacle avoidance algorithms for multi-uav swarm formations operating in GPS-denied environments.',
    github: 'https://github.com/kavitha/swarm-robotics', doc: 'https://docs.google.com/document/d/1swarm-robotics', ppt: 'https://docs.google.com/presentation/d/1swarm-ppt', demo: 'https://youtube.com/watch?v=swarm-demo', vercel: '',
    tech: ['ROS 2', 'C++', 'Python', 'Gazebo'], collaborators: ['Vignesh Kanna'], assignedFaculty: 'Dr. Arumugam Pillai', comments: [], enhancements: []
  },
  {
    id: 9, type: 'External', status: 'Approved', title: 'Quantum-Safe Encryption Protocol', author: 'Kavitha Sundaram', dept: 'Computer Science', category: 'Cybersecurity', likes: 112, commentsCount: 8, views: 890, clones: 62, liked: false,
    abstract: 'Lattice-based post-quantum cryptographic primitives implementation in Rust for secure end-to-end telemetry communication.',
    github: 'https://github.com/kavitha/quantum-safe-crypto', doc: 'https://docs.google.com/document/d/1quantum-crypto', ppt: 'https://docs.google.com/presentation/d/1quantum-ppt', demo: '', vercel: 'https://quantum-crypto-demo.vercel.app',
    tech: ['Rust', 'Qiskit', 'C'], collaborators: [], assignedFaculty: 'Dr. Senthamizhan V', comments: [], enhancements: []
  },
  {
    id: 10, type: 'External', status: 'Approved', title: 'Global Decentralized Healthcare Ledger', author: 'Kavitha Sundaram', dept: 'Computer Science', category: 'Blockchain', likes: 140, commentsCount: 12, views: 1250, clones: 78, liked: false,
    abstract: 'Zero-knowledge proof medical record exchange platform enabling patients to share cryptographic consents with hospital networks securely.',
    github: 'https://github.com/kavitha/healthcare-zk-ledger', doc: 'https://docs.google.com/document/d/1healthcare-zk', ppt: 'https://docs.google.com/presentation/d/1zk-ppt', demo: 'https://youtube.com/watch?v=zk-demo', vercel: 'https://zk-health.vercel.app',
    tech: ['Solidity', 'Hyperledger', 'Go', 'Zero-Knowledge Proofs'], collaborators: ['Karthik Raja'], assignedFaculty: 'Dr. Kabilan Pandian', comments: [], enhancements: []
  },

  // DOMAIN VERIFICATION PENDING EXAMPLE PROJECT (Custom Domain Requested by Student)
  {
    id: 11, type: 'Internal', status: 'Domain Verification Pending', domainStatus: 'Pending', proposedDomain: 'Quantum Computing Simulators', title: 'Quantum Circuit Logic Simulator', author: 'Kavitha Sundaram', dept: 'Computer Science', category: 'Other (Quantum Computing Simulators)', likes: 18, commentsCount: 0, views: 95, clones: 2, liked: false,
    abstract: 'A browser-based interactive quantum logic gate simulator rendering qubit matrix operations in real time.',
    github: 'https://github.com/kavitha/quantum-sim', doc: 'https://docs.google.com/document/d/1quantum-sim', ppt: '', demo: '', vercel: 'https://quantum-sim.vercel.app',
    tech: ['TypeScript', 'WebAssembly', 'React'], collaborators: [], assignedFaculty: 'Unassigned (Awaiting Domain Approval)', comments: [], enhancements: []
  }
];

let reviewQueue = [
  { id: 102, projectId: 3, title: 'Campus Marketplace App', author: 'Karthik Raja', category: 'Mobile Development', submitted: '4 days ago', type: 'External', faculty: 'Dr. Thenmozhi K', isEnhancement: false, abstract: 'Real-time student marketplace app.', github: 'https://github.com/karthik/campus-market', doc: 'https://docs.google.com/document/d/1campus-market', ppt: '', tech: ['React Native', 'Node.js', 'MongoDB'] },
  { id: 103, projectId: 103, title: 'Predictive Maintenance Dashboard', author: 'Kavin Kumar', category: 'Machine Learning', submitted: '4 days ago', type: 'Internal', faculty: 'Dr. Arumugam Pillai', isEnhancement: false, abstract: 'Real-time telemetry analysis dashboard predicting equipment breakdowns using Random Forest.', github: 'https://github.com/kavin/predictive-maint', doc: 'https://docs.google.com/document/d/1pred-maint', ppt: 'https://docs.google.com/presentation/d/1pred-maint-ppt', tech: ['Python', 'Scikit-Learn', 'React', 'FastAPI'] },
  { id: 104, projectId: 104, title: 'Peer Tutoring Scheduler', author: 'Priya Senthil', category: 'Web Development', submitted: '6 days ago', type: 'Internal', faculty: 'Dr. Senthamizhan V', isEnhancement: false, abstract: 'Matching engine for senior and junior students for peer-to-peer academic assistance with integrated calendar syncing.', github: 'https://github.com/priya/peer-tutoring', doc: 'https://docs.google.com/document/d/1peer-tutor', ppt: 'https://docs.google.com/presentation/d/1peer-tutor-ppt', tech: ['Node.js', 'PostgreSQL', 'FullCalendar'] }
];

let domainRequests = [
  { id: 1, projectId: 11, projectTitle: 'Quantum Circuit Logic Simulator', studentName: 'Kavitha Sundaram', proposedDomain: 'Quantum Computing Simulators', description: 'Quantum circuit state simulation using matrix logic gates.', status: 'Pending', submittedAt: '1 day ago' }
];

let guideRequests = [
  { id: 301, student: 'Dhanush Ram', project: 'AI Resume Builder', faculty: 'Dr. Arumugam Pillai', category: 'Machine Learning', requested: '3 days ago' }
];

let collaborationRequests = [
  { id: 1, projectId: 2, projectTitle: 'Smart Campus Navigation', requester: 'Ananya Selvam', owner: 'Priya Senthil', status: 'Pending' }
];

let reports = [
  { id: 1, projectId: 3, projectTitle: 'Campus Marketplace App', reporter: 'Kavin Kumar', reporterEmail: 'kavin@university.edu', category: 'Copyright / Plagiarism', reason: 'Uncredited reuse of component source from another repository.', status: 'Pending', assignedFaculty: 'Dr. Thenmozhi K', createdAt: '1 day ago' }
];

let notifications = [
  { id: 1, email: 'kavitha@university.edu', icon: 'star', text: 'Your External Project was approved. +25 credits', time: '2 hours ago', route: '/profile', read: false },
  { id: 2, email: 'kavitha@university.edu', icon: 'bell', text: 'Dr. Pillai accepted your project guide request', time: '5 hours ago', route: '/projects', read: false },
  { id: 3, email: 'Administrator', icon: 'bell', text: 'Custom domain request "Quantum Computing Simulators" submitted by Kavitha Sundaram', time: '1 day ago', route: '/admin?tab=domains', read: false }
];

let departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'];

let accessTiers = [
  { min: 0, label: 'No Repository Access' },
  { min: 60, label: 'Idea Repository' },
  { min: 100, label: 'Internal Projects' },
  { min: 200, label: 'External Projects' },
  { min: 300, label: 'Gold Level Projects' }
];

let nextProjectId = 12;
let nextCollabRequestId = 2;
let nextReportId = 2;
let nextDomainRequestId = 2;

// 3 Testing Faculty accounts present in testing dropdowns
const TESTING_FACULTY_NAMES = [
  'Dr. Arumugam Pillai',
  'Dr. Senthamizhan V',
  'Dr. Thenmozhi K'
];

// Mapping of domains strictly to the 3 testing faculty for testing phase
const DOMAIN_TO_TESTING_FACULTY = {
  'machine learning': 'Dr. Arumugam Pillai',
  'cloud computing': 'Dr. Arumugam Pillai',
  'blockchain': 'Dr. Arumugam Pillai',
  'web development': 'Dr. Senthamizhan V',
  'cybersecurity': 'Dr. Senthamizhan V',
  'mobile development': 'Dr. Thenmozhi K',
  'internet of things': 'Dr. Thenmozhi K',
  'other': 'Dr. Thenmozhi K'
};

// AUTOMATED FACULTY ASSIGNMENT HELPER
// (In testing phase: strictly mapped to the 3 testing faculties based on selected domain)
function assignRandomFacultyForDomain(domainCategory) {
  if (!domainCategory) return 'Dr. Arumugam Pillai';
  const clean = String(domainCategory).toLowerCase().trim();

  // 1. Direct match in lookup table
  if (DOMAIN_TO_TESTING_FACULTY[clean]) {
    return DOMAIN_TO_TESTING_FACULTY[clean];
  }

  // 2. Keyword matching for variations or custom domains (e.g. "Other (Quantum Computing Simulators)")
  if (clean.includes('machine learning') || clean.includes('cloud') || clean.includes('blockchain') || clean.includes('ai') || clean.includes('deep learning')) {
    return 'Dr. Arumugam Pillai';
  }
  if (clean.includes('web') || clean.includes('cyber') || clean.includes('security') || clean.includes('network')) {
    return 'Dr. Senthamizhan V';
  }
  if (clean.includes('mobile') || clean.includes('iot') || clean.includes('internet of things') || clean.includes('sensor') || clean.includes('other')) {
    return 'Dr. Thenmozhi K';
  }

  // 3. Absolute fallback: Dr. Thenmozhi K
  return 'Dr. Thenmozhi K';
}

module.exports = {
  TESTING_FACULTY_NAMES,
  DOMAIN_TO_TESTING_FACULTY,
  predefinedDomains,
  users,
  projects,
  reviewQueue,
  domainRequests,
  guideRequests,
  collaborationRequests,
  reports,
  notifications,
  departments,
  accessTiers,
  assignRandomFacultyForDomain,
  getNextProjectId: () => nextProjectId++,
  getNextCollabId: () => nextCollabRequestId++,
  getNextReportId: () => nextReportId++,
  getNextDomainRequestId: () => nextDomainRequestId++
};
