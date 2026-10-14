import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import { BadgeType, BadgeStatus } from '../components/common/Badge';
import { EmptyState } from '../components/common/Toast';

export default function ProfilePage() {
  const { currentUser, updateProfileState } = useAuth();
  const { showToast } = useApp();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const queryName = queryParams.get('name');

  const [profileUser, setProfileUser] = useState(null);
  const [domain, setDomain] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [inReview, setInReview] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSelf = !queryName || (currentUser && queryName.toLowerCase() === currentUser.name.toLowerCase());

  useEffect(() => {
    fetchProfileData();
  }, [location.search, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const endpoint = queryName ? `/profile?name=${encodeURIComponent(queryName)}` : '/profile';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setProfileUser(res.data.user);
        setPortfolio(res.data.portfolio);
        setIdeas(res.data.ideas);
        setInReview(res.data.inReview);
        setDomain(res.data.user.domain_of_interest || '');
        setSkills((res.data.user.skills || []).join(', '));
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const res = await api.put('/profile', { domainOfInterest: domain, skills: skillsArray });
      if (res.data.success) {
        showToast(res.data.message);
        updateProfileState(res.data.user);
      }
    } catch (err) {
      showToast('Failed to update profile');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading profile...</div>;
  }

  const targetUser = profileUser || currentUser;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{isSelf ? 'My Profile' : `${targetUser?.name}'s Profile`}</h1>
          <p>{isSelf ? 'Manage your portfolio, skills, and academic interests.' : `${targetUser?.role} profile and portfolio showcase.`}</p>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="card" style={{ padding: '22px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text)' }}>
                Portfolio Projects ({portfolio.length + ideas.length})
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="credit-pill"><Icon name="award" size={13} /> {targetUser?.credits || 0} Credits</span>
                <span className="badge badge-gray">{targetUser?.approved_projects || 0} Approved</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {portfolio.map((p) => (
                <div key={p.id} className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Category: {p.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <BadgeType type={p.type} />
                    <BadgeStatus status={p.status} />
                  </div>
                </div>
              ))}
              {ideas.map((p) => (
                <div key={p.id} className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Category: {p.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <BadgeType type={p.type} />
                  </div>
                </div>
              ))}
              {isSelf && inReview.map((p) => (
                <div key={p.id} className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--muted)' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Category: {p.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <BadgeType type={p.type} />
                    <BadgeStatus status={p.status} />
                  </div>
                </div>
              ))}
              {portfolio.length === 0 && ideas.length === 0 && (inReview.length === 0 || !isSelf) && (
                <EmptyState msg="No projects uploaded yet." ic="folder" />
              )}
            </div>
          </div>

          {/* CREDIT HISTORY AUDIT LOG */}
          <div className="card" style={{ padding: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="award" size={18} /> Credit History Audit Log
              </h3>
              <span className="credit-pill"><Icon name="star" size={12} /> Total: {targetUser?.credits || 0} Points</span>
            </div>

            {targetUser?.creditHistory && targetUser.creditHistory.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Activity / Event</th>
                      <th>Date</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetUser.creditHistory.map((item) => (
                      <tr key={item.id}>
                        <td style={{ color: '#e2e8f0', fontWeight: 500 }}>{item.title}</td>
                        <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{item.date}</td>
                        <td>
                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                            +{item.points} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>
                No credit transactions logged yet. Points are awarded upon project approvals, ideas, and enhancements.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: 'var(--text)' }}>
              {isSelf ? 'Edit Profile Details' : 'Student Information'}
            </h3>
            {isSelf ? (
              <form onSubmit={handleSaveProfile}>
                <div className="field">
                  <label>Department</label>
                  <input type="text" disabled value={targetUser?.dept || ''} />
                </div>
                <div className="field">
                  <label>Academic Year</label>
                  <input type="text" disabled value={targetUser?.academic_year || ''} />
                </div>
                <div className="field">
                  <label>Domain of Interest</label>
                  <input
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Machine Learning, Web Dev"
                  />
                </div>
                <div className="field">
                  <label>Skills (comma separated)</label>
                  <input
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. React, Python, SQL"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  Save Profile
                </button>
              </form>
            ) : (
              <div style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <b style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Department</b>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{targetUser?.dept}</span>
                </div>
                <div>
                  <b style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Academic Year</b>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{targetUser?.academic_year}</span>
                </div>
                <div>
                  <b style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Domain of Interest</b>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{targetUser?.domain_of_interest || 'Not specified'}</span>
                </div>
                <div>
                  <b style={{ color: 'var(--muted)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Skills & Expertise</b>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(targetUser?.skills || []).map((s, idx) => (
                      <span key={idx} className="badge badge-gray">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
