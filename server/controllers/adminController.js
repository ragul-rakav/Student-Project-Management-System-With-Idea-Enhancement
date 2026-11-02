const bcrypt = require('bcryptjs');
const dataStore = require('../services/dataStore');

function helperInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

exports.getUsers = (req, res) => {
  try {
    const usersClean = dataStore.users.map(({ password, ...u }) => u);
    return res.json({ success: true, users: usersClean });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
    }

    const hashedPassword = await bcrypt.hash('password', 10);
    const newUser = {
      id: dataStore.users.length + 1,
      name,
      email,
      password: hashedPassword,
      role,
      status: 'Active',
      dept: role === 'Student' ? 'Computer Science' : role === 'Faculty' ? 'Computer Science' : 'Platform Admin',
      academic_year: role === 'Student' ? 'Third Year' : '—',
      credits: 0,
      approved_projects: 0,
      skills: [],
      domain_of_interest: '',
      initials: helperInitials(name)
    };

    dataStore.users.push(newUser);
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'users',
      text: `Added user: ${name} as ${role}`,
      time: 'Just now'
    });

    const { password: _, ...userClean } = newUser;
    return res.status(201).json({ success: true, message: `${name} added as ${role}`, user: userClean });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeUser = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userIndex = dataStore.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const removed = dataStore.users.splice(userIndex, 1)[0];
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'users',
      text: `User removed: ${removed.name}`,
      time: 'Just now'
    });

    return res.json({ success: true, message: `${removed.name} removed` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDepartments = (req, res) => {
  try {
    return res.json({ success: true, departments: dataStore.departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addDepartment = (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const deptName = name.trim();
    if (dataStore.departments.includes(deptName)) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    dataStore.departments.push(deptName);
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'bell',
      text: `New department added: ${deptName}`,
      time: 'Just now'
    });

    return res.status(201).json({ success: true, message: `Department "${deptName}" added`, departments: dataStore.departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeDepartment = (req, res) => {
  try {
    const { name } = req.params;
    const index = dataStore.departments.findIndex(d => d.toLowerCase() === name.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const removed = dataStore.departments.splice(index, 1)[0];
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'bell',
      text: `Department removed: ${removed}`,
      time: 'Just now'
    });

    return res.json({ success: true, message: `Department "${removed}" removed`, departments: dataStore.departments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTiers = (req, res) => {
  try {
    return res.json({ success: true, accessTiers: dataStore.accessTiers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTiers = (req, res) => {
  try {
    const { idea, internal, external } = req.body;
    if (idea !== undefined) dataStore.accessTiers[1].min = parseInt(idea);
    if (internal !== undefined) dataStore.accessTiers[2].min = parseInt(internal);
    if (external !== undefined) dataStore.accessTiers[3].min = parseInt(external);

    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: 'Administrator',
      icon: 'bell',
      text: `Repository access tiers settings updated`,
      time: 'Just now'
    });

    return res.json({ success: true, message: 'Repository access tiers updated successfully', accessTiers: dataStore.accessTiers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = (req, res) => {
  try {
    const totalProjects = dataStore.projects.length;
    const approvedProjects = dataStore.projects.filter(p => p.status === 'Approved').length;
    const activeStudents = dataStore.users.filter(u => u.role === 'Student').length;
    const pendingReviews = dataStore.reviewQueue.length;

    const internalCount = dataStore.projects.filter(p => p.type === 'Internal').length;
    const externalCount = dataStore.projects.filter(p => p.type === 'External').length;
    const ideaCount = dataStore.projects.filter(p => p.type === 'Idea').length;

    const categories = [
      ['Internal Projects', internalCount, totalProjects || 1],
      ['External Projects', externalCount, totalProjects || 1],
      ['Ideas', ideaCount, totalProjects || 1]
    ];

    const deptCounts = {};
    dataStore.projects.forEach(p => {
      deptCounts[p.dept] = (deptCounts[p.dept] || 0) + 1;
    });

    const departments = Object.keys(deptCounts).map(d => [d, deptCounts[d]]);

    return res.json({
      success: true,
      analytics: {
        totalProjects,
        approvedProjects,
        activeStudents,
        pendingReviews,
        categories,
        departments
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNotifications = (req, res) => {
  try {
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userRole = (req.user?.role || '').trim();
    const userName = (req.user?.name || '').toLowerCase().trim();

    const myNotifs = dataStore.notifications.filter(n => {
      if (!n) return false;
      const target = (n.email || '').toLowerCase().trim();
      const recipient = (n.recipientName || '').toLowerCase().trim();

      // 1. Direct match with email
      if (target && target === userEmail) return true;

      // 2. Direct match with user's full name (e.g. Dr. Arumugam Pillai, Dr. Senthamizhan V, Dr. Thenmozhi K)
      if (userName && (target === userName || recipient === userName || target.includes(userName) || userName.includes(target))) return true;

      // 3. Match by role (Administrator / Admin / Faculty / Student)
      if (target === userRole.toLowerCase()) return true;
      if (userRole === 'Administrator' && (target === 'administrator' || target === 'admin' || target === 'admin user' || target === 'admin@university.edu')) return true;
      if (userRole === 'Faculty' && (target === 'faculty' || target === 'staff')) return true;
      if (userRole === 'Student' && target === 'student') return true;

      // 4. Match if notification was stored with faculty's name and logged-in user is that faculty
      const matchedFaculty = dataStore.users.find(u => u.name && u.name.toLowerCase() === target);
      if (matchedFaculty && matchedFaculty.email.toLowerCase() === userEmail) return true;

      return false;
    });

    return res.json({ success: true, notifications: myNotifs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteNotification = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    dataStore.notifications = dataStore.notifications.filter(n => n.id !== id);
    return res.json({ success: true, message: 'Notification removed' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markNotificationRead = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const n = dataStore.notifications.find(item => item.id === id);
    if (n) n.read = true;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReports = (req, res) => {
  try {
    return res.json({ success: true, reports: dataStore.reports || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveReport = (req, res) => {
  try {
    const { reportId, action, remark } = req.body;
    if (!remark || !remark.trim()) {
      return res.status(400).json({ success: false, message: 'Written remark/reason is required before resolving report.' });
    }

    const report = (dataStore.reports || []).find(r => r.id === parseInt(reportId));
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const reporterUser = dataStore.users.find(u => 
      u.name.toLowerCase() === report.reporter.toLowerCase() ||
      (report.reporterEmail && u.email.toLowerCase() === report.reporterEmail.toLowerCase())
    );

    if (action === 'deleteProject') {
      const projIndex = dataStore.projects.findIndex(p => p.id === report.projectId);
      if (projIndex !== -1) {
        dataStore.projects.splice(projIndex, 1);
      }
      report.status = `Approved: Project Removed (Remark: ${remark})`;

      if (reporterUser) {
        reporterUser.credits = (reporterUser.credits || 0) + 5;
        reporterUser.creditHistory = reporterUser.creditHistory || [];
        reporterUser.creditHistory.unshift({
          id: Date.now(),
          title: `Valid Content Moderation Report Reward`,
          points: 5,
          date: new Date().toISOString().split('T')[0],
          type: 'reward'
        });
      }

      return res.json({ success: true, message: `Report approved — project removed. Remark logged: "${remark}"` });
    } else {
      report.status = `Dismissed / Fake Report (Remark: ${remark})`;

      // FAKE REPORT PENALTY: -5 CREDITS DEDUCTED FROM REPORTER
      if (reporterUser) {
        reporterUser.credits = Math.max(0, (reporterUser.credits || 0) - 5);
        reporterUser.creditHistory = reporterUser.creditHistory || [];
        reporterUser.creditHistory.unshift({
          id: Date.now(),
          title: `Fake / Invalid Report Penalty (${report.projectTitle})`,
          points: -5,
          date: new Date().toISOString().split('T')[0],
          type: 'penalty'
        });

        dataStore.notifications.unshift({
          id: dataStore.notifications.length + 1,
          email: reporterUser.email,
          icon: 'x',
          text: `Your content report on "${report.projectTitle}" was dismissed as invalid. -5 credits penalty applied. Remark: "${remark}"`,
          time: 'Just now',
          route: '/profile',
          read: false
        });
      }

      return res.json({ success: true, message: `Report dismissed as fake/invalid. -5 credits deducted from ${report.reporter}.` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDomainRequests = (req, res) => {
  try {
    return res.json({ success: true, domainRequests: dataStore.domainRequests || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveDomainRequest = (req, res) => {
  try {
    const { requestId, action, assignedFaculty, approvedDomainName } = req.body;
    const request = (dataStore.domainRequests || []).find(r => r.id === parseInt(requestId));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Domain request not found' });
    }

    const project = dataStore.projects.find(p => p.id === request.projectId);

    if (action === 'approve') {
      request.status = 'Approved';
      const finalDomain = approvedDomainName || request.proposedDomain;

      // Add to predefined domains if new
      if (!dataStore.predefinedDomains.includes(finalDomain)) {
        dataStore.predefinedDomains.push(finalDomain);
      }

      if (project) {
        project.category = finalDomain;
        project.status = project.type === 'Internal' ? 'In Review' : 'Pending Guide';
        const selectedFaculty = assignedFaculty || dataStore.assignRandomFacultyForDomain(finalDomain);
        project.assignedFaculty = selectedFaculty;

        if (project.type === 'Internal') {
          dataStore.reviewQueue.unshift({
            id: project.id,
            projectId: project.id,
            title: project.title,
            author: project.author,
            category: finalDomain,
            submitted: 'Just now',
            type: 'Internal',
            faculty: selectedFaculty,
            isEnhancement: false,
            abstract: project.abstract,
            github: project.github,
            doc: project.doc,
            ppt: project.ppt,
            tech: project.tech,
            files: project.files
          });
        } else {
          dataStore.guideRequests.unshift({
            id: project.id,
            projectId: project.id,
            student: project.author,
            project: project.title,
            faculty: selectedFaculty,
            category: finalDomain,
            requested: 'Just now'
          });
        }

        dataStore.notifications.unshift({
          id: dataStore.notifications.length + 1,
          email: project.author,
          icon: 'check',
          text: `Your custom domain "${finalDomain}" for project "${project.title}" was approved by Administrator!`,
          time: 'Just now',
          route: '/projects',
          read: false
        });
      }

      return res.json({ success: true, message: `Domain "${finalDomain}" approved and project assigned to ${project ? project.assignedFaculty : 'Faculty'}.` });
    } else {
      request.status = 'Rejected';
      if (project) {
        project.status = 'Domain Rejected';
      }
      return res.json({ success: true, message: 'Custom domain request rejected' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFacultyConfig = (req, res) => {
  try {
    const { facultyId, specializations, maxPendingThreshold } = req.body;
    const faculty = dataStore.users.find(u => u.id === parseInt(facultyId) && u.role === 'Faculty');

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    if (specializations && Array.isArray(specializations)) {
      faculty.specializations = specializations;
    }
    if (maxPendingThreshold !== undefined) {
      faculty.maxPendingThreshold = parseInt(maxPendingThreshold);
    }

    return res.json({ success: true, message: `Updated configuration for ${faculty.name}`, faculty });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
