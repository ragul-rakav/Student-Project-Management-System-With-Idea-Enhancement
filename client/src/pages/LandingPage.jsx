import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Icon from '../components/common/Icons';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-mark" style={{ background: 'var(--accent-grad)' }}>
            <Icon name="book" size={18} />
          </div>
          <span className="brand" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)' }}>ProjectPulse</span>
        </div>
        <nav className="landing-nav">
          <a onClick={() => navigate('/login')}>Repositories</a>
          <a onClick={() => navigate('/login')}>Originality Engine</a>
          <a onClick={() => navigate('/login')}>Faculty Review</a>
          <a onClick={() => navigate('/login')}>Leaderboard</a>
        </nav>
        <div className="landing-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
          <a className="signin" onClick={() => navigate('/login')}>Sign in</a>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow"><Icon name="sparkle" size={14} /> AI-Powered Academic Verification</div>
          <h1>Showcase your projects.<br />Verify originality. Earn recognition.</h1>
          <p className="lead">The next-generation platform for students to submit academic builds, publish novel ideas, verify similarity against historical repositories, and collaborate with peers.</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Explore Dashboard <Icon name="arrow" size={15} /></button>
            <button className="btn btn-outline" onClick={() => navigate('/login')}>Browse Projects</button>
          </div>
          <div className="hero-check">
            <span><Icon name="check" size={15} /> AI similarity checking</span>
            <span><Icon name="check" size={15} /> Faculty verified</span>
            <span><Icon name="check" size={15} /> Credit points system</span>
          </div>
        </div>
        <div className="hero-art">
          <svg viewBox="0 0 200 150" width="80%" height="80%">
            <rect x="10" y="20" width="46" height="30" rx="4" fill="#3b82f6" opacity="0.8" />
            <rect x="66" y="10" width="46" height="30" rx="4" fill="#6366f1" opacity="0.9" />
            <rect x="122" y="30" width="46" height="30" rx="4" fill="#8b5cf6" opacity="0.8" />
            <circle cx="150" cy="90" r="14" fill="#fbbf24" />
            <rect x="20" y="90" width="34" height="46" rx="4" fill="#6366f1" opacity="0.7" />
            <rect x="70" y="70" width="34" height="66" rx="4" fill="#4f46e5" opacity="0.85" />
          </svg>
        </div>
      </section>

      <div className="stats-strip">
        <div className="stats-inner">
          <div><div className="num">1,240+</div><div className="lab">Projects Submitted</div></div>
          <div><div className="num">86</div><div className="lab">Faculty Reviewers</div></div>
          <div><div className="num">5,200+</div><div className="lab">Student Users</div></div>
          <div><div className="num">98%</div><div className="lab">Integrity Verified</div></div>
        </div>
      </div>

      <section className="feat-section">
        <h2>Everything you need to manage student projects</h2>
        <p>From submission to showcase, every workflow is designed to prevent duplicates, elevate quality, and reward innovation.</p>
        <div className="feat-grid">
          {[
            ['folder', 'Verified Repositories', 'Separate tiers for internal academic projects, external showcases, and raw project ideas.'],
            ['chart', 'AI Originality Engine', 'Vector-based semantic similarity and n-gram overlap check prevents duplicate submissions.'],
            ['shield', 'Faculty Governance', 'Automated reviewer assignment for internal projects with workload capacity tracking.'],
            ['award', 'Credit Point Economy', 'Earn points for approved projects, novel ideas, and collaboration to unlock higher repository tiers.'],
            ['users', 'Collaborative Enhancement', 'Propose pull-request improvements to existing projects and share academic credit.'],
            ['trophy', 'Academic Leaderboards', 'Department and semester rankings celebrating student innovators and research builders.']
          ].map(([ic, t, d], i) => (
            <div key={i} className="card feat-card"><div className="icon"><Icon name={ic} size={18} /></div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="how-section">
        <h2>How it works</h2>
        <div className="how-grid">
          {[
            ['Submit or publish', 'Submit an academic build, an external project, or publish a raw concept in minutes.'],
            ['AI Originality Check', 'The vector engine analyzes semantics, n-grams, and tech overlap with smart suggestions.'],
            ['Faculty Evaluation', 'Department faculty review the submission against academic integrity rubrics.'],
            ['Unlock & rank', 'Earn credits, climb the department leaderboard, and showcase your verified portfolio.']
          ].map(([t, d], i) => (
            <div key={i} className="how-step"><div className="n">STEP {i + 1}</div><h4>{t}</h4><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="cta-final">
        <h2>Ready to build your verified portfolio?</h2>
        <p>Join thousands of students and faculty already maintaining academic integrity and innovation.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started for free <Icon name="arrow" size={15} /></button>
      </section>

      <footer className="landing-footer">&copy; 2026 ProjectPulse &bull; AI Originality &amp; Academic Repository Platform.</footer>
    </div>
  );
}
