import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import { EmptyState } from '../components/common/Toast';

const CREDIT_RULES = [
  ['Internal Project Approved', 10],
  ['External Project Approved', 20],
  ['Idea Published', 5],
  ['Project Enhancement (Owner Reward)', 10],
  ['Every 10 Likes on a Project', 1],
];

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('overall');
  const [dept, setDept] = useState(currentUser?.dept || 'Computer Science');
  const [year, setYear] = useState(currentUser?.academic_year || 'Third Year');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, dept, year, search]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaderboard', { params: { filter, dept, year, search } });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const helperInitials = (name) => name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'ST';

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push(top3[1]);
  if (top3[0]) podiumOrder.push(top3[0]);
  if (top3[2]) podiumOrder.push(top3[2]);

  const rest = filter === 'overall' ? leaderboard.slice(3) : leaderboard;
  const departmentsList = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'];
  const yearsList = ['First Year', 'Second Year', 'Third Year', 'Final Year'];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Student Leaderboard</h1>
          <p>Rankings based on total credit points and approved projects.</p>
        </div>
      </div>

      {podiumOrder.length > 0 && (
        <div className="podium">
          {podiumOrder.map((s) => (
            <div
              key={s.rank}
              className={`card podium-card ${s.rank === 1 ? 'first' : ''}`}
              onClick={() => navigate(`/profile?name=${encodeURIComponent(s.name)}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`rank-pill ${s.rank === 1 ? 'gold' : s.rank === 2 ? 'silver' : 'bronze'}`}>#{s.rank}</div>
              <div className="avatar-lg">{helperInitials(s.name)}</div>
              <div className="podium-name clickable-name">{s.name}</div>
              <div className="podium-meta">{s.dept} &middot; {s.year}</div>
              <div className="podium-stats">
                <div><div>{s.credits}</div><div>Credits</div></div>
                <div><div>{s.projects}</div><div>Projects</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="toolbar">
        <div style={{ display: 'flex', gap: '8px', items: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            <div className={`tab ${filter === 'overall' ? 'active' : ''}`} onClick={() => setFilter('overall')}>Overall</div>
            <div className={`tab ${filter === 'dept' ? 'active' : ''}`} onClick={() => setFilter('dept')}>Department</div>
            <div className={`tab ${filter === 'year' ? 'active' : ''}`} onClick={() => setFilter('year')}>Academic Year</div>
          </div>
          {filter === 'dept' && (
            <select
              className="field"
              style={{ width: 'auto', margin: 0, border: '1px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '13.5px', background: 'rgba(3,7,18,0.4)', color: 'var(--text)' }}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              {departmentsList.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {filter === 'year' && (
            <select
              className="field"
              style={{ width: 'auto', margin: 0, border: '1px solid var(--border)', borderRadius: '10px', padding: '7px 12px', fontSize: '13.5px', background: 'rgba(3,7,18,0.4)', color: 'var(--text)' }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {yearsList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
        <div className="search-wrap">
          <Icon name="search2" size={16} />
          <input
            className="search-input"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '30px' }}>Loading rankings...</div>
        ) : rest.length ? (
          <table>
            <thead>
              <tr><th>Rank</th><th>Student</th><th>Department</th><th>Year</th><th>Projects</th><th>Credits</th></tr>
            </thead>
            <tbody>
              {rest.map((s) => (
                <tr key={s.rank}>
                  <td className="rank-num">#{s.rank}</td>
                  <td>
                    <div className="stu-row" onClick={() => navigate(`/profile?name=${encodeURIComponent(s.name)}`)} style={{ cursor: 'pointer' }}>
                      <div className="avatar-sm">{helperInitials(s.name)}</div>
                      <span className="clickable-name">{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{s.dept}</td>
                  <td style={{ color: 'var(--muted)' }}>{s.year}</td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.projects}</td>
                  <td><span className="credit-pill"><Icon name="award" size={12} /> {s.credits}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState msg="No rankings match selected filters." ic="search2" />
        )}
      </div>

      <div className="card" style={{ padding: '20px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '15.5px', color: 'var(--text)' }}>Credit Policy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
          {CREDIT_RULES.map(([label, val], idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-bg)', borderRadius: '10px', padding: '10px 13px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <span style={{ color: '#cbd5e1' }}>{label}</span>
              <span className="credit-pill"><Icon name="award" size={12} /> +{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
