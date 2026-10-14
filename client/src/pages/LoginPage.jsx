import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Icon from '../components/common/Icons';

const roleMeta = {
  Student: { icon: 'bulb', line: 'Submit projects, publish ideas, and climb the leaderboard.' },
  Faculty: { icon: 'book', line: 'Review submissions, accept guide requests, award credits.' },
  Administrator: { icon: 'shield', line: 'Oversee the repository, users, and platform analytics.' },
};

const facultyTestAccounts = [
  { name: 'Dr. Arumugam Pillai', email: 'arumugam@university.edu', dept: 'Machine Learning & Cloud' },
  { name: 'Dr. Senthamizhan V', email: 'senthamizhan@university.edu', dept: 'Web Dev & Cybersecurity' },
  { name: 'Dr. Thenmozhi K', email: 'thenmozhi@university.edu', dept: 'Mobile & IoT' }
];

export default function LoginPage() {
  const [loginRole, setLoginRole] = useState('Student');
  const [email, setEmail] = useState('kavitha@university.edu');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [selectedFacultyTest, setSelectedFacultyTest] = useState('');

  const { login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleRoleChange = (r) => {
    setLoginRole(r);
    setSelectedFacultyTest('');
    if (r === 'Faculty') setEmail('arumugam@university.edu');
    else if (r === 'Administrator') setEmail('admin@university.edu');
    else setEmail('kavitha@university.edu');
  };

  const handleSelectFacultyAccount = (e) => {
    const selectedEmail = e.target.value;
    setSelectedFacultyTest(selectedEmail);
    if (selectedEmail) {
      setLoginRole('Faculty');
      setEmail(selectedEmail);
      setPassword('password');
      const fac = facultyTestAccounts.find(f => f.email === selectedEmail);
      showToast(`Selected test faculty: ${fac?.name}`);
    }
  };

  const handleQuickStudentFill = () => {
    setLoginRole('Student');
    setEmail('kavitha@university.edu');
    setPassword('password');
    showToast('Filled student test credentials (Kavitha Sundaram)');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password, loginRole);
      showToast(`Welcome back, ${data.user.name} (${data.user.role})`);
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-side">
        <div className="top">
          <div className="brand-mark">
            <Icon name="book" size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.01em' }}>ProjectPulse</span>
        </div>
        <div>
          <h2>Showcase your work. Get verified. Earn recognition.</h2>
          <p>The academic project repository with automated similarity checking, idea enhancement suggestions, and faculty peer evaluation.</p>
        </div>
        <div className="quote">"Built for academic excellence" — trusted by Computer Science, IT, Electronics & Mechanical departments.</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <h1>Sign in</h1>
          <p className="sub">Choose your role or select a faculty test account to get started.</p>

          {/* 3 FACULTY TEST LOGIN DROPDOWN */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '18px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon name="dice" size={13} /> Quick Faculty Testing (3 Logins)
              </span>
              <button
                type="button"
                onClick={handleQuickStudentFill}
                style={{
                  fontSize: '11px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Or test as student
              </button>
            </div>
            <select
              value={selectedFacultyTest}
              onChange={handleSelectFacultyAccount}
              style={{
                width: '100%',
                fontSize: '12.5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <option value="">-- Select a Faculty Account for Testing --</option>
              {facultyTestAccounts.map((fac) => (
                <option key={fac.email} value={fac.email}>
                  {fac.name} &bull; {fac.dept}
                </option>
              ))}
            </select>
          </div>

          <div className="role-toggle">
            {Object.keys(roleMeta).map((r) => (
              <div
                key={r}
                className={`r ${loginRole === r ? 'active' : ''}`}
                onClick={() => handleRoleChange(r)}
              >
                <Icon name={roleMeta[r].icon} size={15} />
                <span>{r}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '-10px 0 16px' }}>
            {roleMeta[loginRole].line}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="login-actions-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 'auto' }} defaultChecked /> Remember me
              </label>
              <a onClick={() => showToast('Password reset link sent to ' + email)}>Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}
            >
              {loading ? 'Authenticating...' : `Continue as ${loginRole}`} <Icon name="arrow" size={15} />
            </button>
          </form>

          <div className="demo-hint">
            <Icon name="shield" size={14} style={{ color: 'var(--accent)' }} />
            <span>Select any role or test faculty account above. Direct JWT session established automatically.</span>
          </div>

          <div className="login-switch">
            New to ProjectPulse? <Link to="/register">Register student account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
