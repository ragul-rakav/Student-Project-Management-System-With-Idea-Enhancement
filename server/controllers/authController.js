const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dataStore = require('../services/dataStore');
const { authService, JWT_ACCESS_SECRET } = require('../services/authService');
const db = require('../config/db');

function helperInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('projectpulse_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, dept, year } = req.body;

    if (!name || !email || !password || !dept || !year) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = dataStore.users.length + 1;
    const newUser = {
      id: newId,
      name,
      email,
      password: hashedPassword,
      role: 'Student',
      status: 'Active',
      dept,
      academic_year: year,
      credits: 0,
      approved_projects: 0,
      skills: ['HTML', 'CSS', 'JavaScript'],
      domain_of_interest: 'Web Development',
      initials: helperInitials(name)
    };

    dataStore.users.push(newUser);

    // Synchronize to PostgreSQL if connected
    if (db.isPgConnected()) {
      try {
        await db.pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status, dept, academic_year, credits, approved_projects, skills, domain_of_interest, initials)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [newId, name, email, hashedPassword, 'Student', 'Active', dept, year, 0, 0, ['HTML', 'CSS', 'JavaScript'], 'Web Development', helperInitials(name)]
        );
      } catch (dbErr) {
        console.warn('DB register sync warning:', dbErr.message);
      }
    }

    // Notifications
    dataStore.notifications.unshift({
      id: dataStore.notifications.length + 1,
      email: email,
      icon: 'award',
      text: 'Welcome to ProjectPulse! Start by submitting your project idea or explore existing work.',
      time: 'Just now'
    });

    const accessToken = authService.generateAccessToken(newUser);
    const refreshToken = authService.generateRefreshToken(newUser);
    await authService.storeRefreshToken(newUser.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: accessToken,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required' });
    }

    let user = dataStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: dataStore.users.length + 1,
        name: role === 'Faculty' ? 'Faculty Member' : role === 'Administrator' ? 'Admin User' : 'Student User',
        email,
        password: await bcrypt.hash(password, 10),
        role,
        status: 'Active',
        dept: role === 'Student' ? 'Computer Science' : role === 'Faculty' ? 'Computer Science' : 'Platform Admin',
        academic_year: role === 'Student' ? 'Third Year' : '—',
        credits: role === 'Student' ? 100 : 0,
        approved_projects: role === 'Student' ? 3 : 0,
        skills: [],
        domain_of_interest: '',
        initials: helperInitials(role === 'Faculty' ? 'Faculty Member' : role === 'Administrator' ? 'Admin User' : 'Student User')
      };
      dataStore.users.push(user);
    } else {
      user.role = role;
    }

    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);
    await authService.storeRefreshToken(user.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}`,
      token: accessToken,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.projectpulse_refresh || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token cookie required' });
    }

    const result = await authService.rotateRefreshToken(rawRefreshToken);
    setRefreshTokenCookie(res, result.refreshToken);

    const { password: _, ...userWithoutPassword } = result.user;
    return res.json({
      success: true,
      token: result.accessToken,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.projectpulse_refresh || req.body?.refreshToken;
    if (rawRefreshToken) {
      await authService.revokeRefreshToken(rawRefreshToken);
    }
    res.clearCookie('projectpulse_refresh');
    return res.json({ success: true, message: 'Logged out cleanly' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = dataStore.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
