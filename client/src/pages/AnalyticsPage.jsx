import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from '../components/common/Icons';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading Analytics...</div>;
  }

  const a = analytics || {
    totalProjects: 12, approvedProjects: 9, activeStudents: 10, pendingReviews: 2,
    categories: [['Internal Projects', 5, 12], ['External Projects', 4, 12], ['Ideas', 3, 12]],
    departments: [['Computer Science', 6], ['Information Technology', 3], ['Electronics', 2], ['Mechanical', 1]]
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>Platform-wide statistics and repository health overview.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-top"><span>Total Projects</span><div className="stat-icon"><Icon name="folder" size={16} /></div></div>
          <div className="stat-value">{a.totalProjects}</div>
          <div className="stat-sub">active submissions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Approved Projects</span><div className="stat-icon"><Icon name="chart" size={16} /></div></div>
          <div className="stat-value">{a.approvedProjects}</div>
          <div className="stat-sub up">approved status</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Active Students</span><div className="stat-icon"><Icon name="users" size={16} /></div></div>
          <div className="stat-value">{a.activeStudents}</div>
          <div className="stat-sub">registered student accounts</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Pending Reviews</span><div className="stat-icon"><Icon name="chart" size={16} /></div></div>
          <div className="stat-value">{a.pendingReviews}</div>
          <div className="stat-sub">awaiting faculty action</div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'var(--text)' }}>Projects by Category</h3>
          {a.categories.map(([label, val, tot], idx) => (
            <div key={idx} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
                <span>{label}</span><b style={{ color: 'var(--text)' }}>{val}</b>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.round((val / (tot || 1)) * 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--text)' }}>Top Departments</h3>
          {a.departments.map(([label, val], idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
              <span>{label}</span><b style={{ color: 'var(--text)' }}>{val} projects</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
