import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Icon from '../components/common/Icons';
import RandomFillButton from '../components/common/RandomFillButton';
import { getRandomStudent } from '../utils/mockDataGenerator';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dept, setDept] = useState('Computer Science');
  const [year, setYear] = useState('Third Year');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleAutoFillStudent = () => {
    const mock = getRandomStudent();
    setName(mock.name);
    setEmail(mock.email);
    setPassword(mock.password);
    setDept(mock.dept);
    setYear(mock.year);
    showToast(`Filled student registration form for ${mock.name}`);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, dept, year });
      showToast('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Registration failed');
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
          <span style={{ fontWeight: 700, fontSize: '18px' }}>ProjectPulse</span>
        </div>
        <div>
          <h2>Create your student account. Get started.</h2>
          <p>Register to submit projects, publish ideas, collaborate with peers, and climb the leaderboard.</p>
        </div>
        <div className="quote">"Built for academic excellence" — used across Computer Science, IT, Electronics & Mechanical departments.</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h1 style={{ margin: 0 }}>Register Student</h1>
            <RandomFillButton onFill={handleAutoFillStudent} label="Test Auto-Fill" />
          </div>
          <p className="sub">Enter your details or auto-fill to create an account for testing.</p>

          <form onSubmit={handleRegister}>
            <div className="field">
              <label>Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Iyer"
              />
            </div>
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

            <div className="field">
              <label>Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Electronics</option>
                <option>Mechanical</option>
              </select>
            </div>

            <div className="field">
              <label>Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option>First Year</option>
                <option>Second Year</option>
                <option>Third Year</option>
                <option>Final Year</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '10px' }}>
              {loading ? 'Creating account...' : 'Create Account'} <Icon name="arrow" size={15} />
            </button>
          </form>

          <div className="login-switch" style={{ marginTop: '20px' }}>
            Already have an account? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
