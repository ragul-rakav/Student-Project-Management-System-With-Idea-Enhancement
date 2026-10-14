import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [recentProjects, setRecentProjects] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [guideReqs, setGuideReqs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      if (!recentProjects.length) setLoading(true);
      const [projRes, lbRes, notifRes] = await Promise.all([
        api.get('/projects?limit=3'),
        api.get('/leaderboard'),
        api.get('/admin/notifications')
      ]);

      if (projRes.data.success) setRecentProjects(projRes.data.projects);
      if (lbRes.data.success) setLeaderboard(lbRes.data.leaderboard);
      if (notifRes.data.success) setNotifications(notifRes.data.notifications);

      if (currentUser?.role === 'Faculty') {
        const [revRes, guideRes] = await Promise.all([
          api.get('/reviews'),
          api.get('/guides')
        ]);
        if (revRes.data.success) setReviews(revRes.data.reviews);
        if (guideRes.data.success) setGuideReqs(guideRes.data.requests);
      }

      if (currentUser?.role === 'Administrator') {
        const anaRes = await api.get('/admin/analytics');
        if (anaRes.data.success) setAnalytics(anaRes.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (id, approve) => {
    try {
      const res = await api.post('/reviews/action', { id, approve });
      if (res.data.success) {
        showToast(res.data.message);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Review action failed');
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.delete(`/admin/notifications/${id}`);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast('Notification removed');
      }
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      await api.post(`/admin/notifications/${n.id}/read`);
    } catch (err) {}
    if (n.route) {
      navigate(n.route);
    } else {
      navigate('/projects');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading Dashboard...</div>;
  }

  if (currentUser?.role === 'Faculty') {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Welcome, {currentUser.name}</h1>
            <p>Your review queue and guide requests at a glance.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/reviews')}>
            <Icon name="book" size={16} /> Go to Reviews
          </button>
        </div>

        <div className="stat-grid">
          <div className="card stat-card">
            <div className="stat-top"><span>Pending Reviews</span><div className="stat-icon"><Icon name="book" size={16} /></div></div>
            <div className="stat-value">{reviews.length}</div>
            <div className="stat-sub">awaiting your decision</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Guide Requests</span><div className="stat-icon"><Icon name="chat" size={16} /></div></div>
            <div className="stat-value">{guideReqs.length}</div>
            <div className="stat-sub">new external requests</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Projects Approved</span><div className="stat-icon"><Icon name="check" size={16} /></div></div>
            <div className="stat-value">28</div>
            <div className="stat-sub">all-time as reviewer</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Students Mentored</span><div className="stat-icon"><Icon name="users" size={16} /></div></div>
            <div className="stat-value">11</div>
            <div className="stat-sub">across departments</div>
          </div>
        </div>

        <div className="dash-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text)' }}>Awaiting your review</h3>
              <a onClick={() => navigate('/reviews')} style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Open Reviews <Icon name="arrow" size={14} />
              </a>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              {reviews.length ? (
                <table>
                  <thead>
                    <tr><th>Project / Enhancement</th><th>Author</th><th>Category</th><th>Type</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reviews.slice(0, 4).map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.isEnhancement ? `Enhancement: ${r.enhancementTitle}` : r.title}</td>
                        <td>{r.author}</td>
                        <td style={{ color: 'var(--muted)' }}>{r.category}</td>
                        <td><span className="badge badge-gray">{r.type}</span></td>
                        <td style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleReviewAction(r.id, true)}>Approve</button>
                          <button className="btn btn-danger-outline btn-sm" onClick={() => handleReviewAction(r.id, false)}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty"><Icon name="check" size={30} /><div>No pending reviews right now.</div></div>
              )}
            </div>
          </div>

          <div>
            <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--text)' }}>New guide requests</h3>
              {guideReqs.length ? guideReqs.map((g) => (
                <div key={g.id} className="notif-item">
                  <div className="notif-icon"><Icon name="chat" size={15} /></div>
                  <div>
                    <div className="notif-text"><b>{g.student}</b> requested you as guide for "{g.project}"</div>
                    <div className="notif-time"><Icon name="bell" size={11} /> {g.requested}</div>
                  </div>
                </div>
              )) : (
                <div className="empty"><Icon name="chat" size={30} /><div>No new guide requests.</div></div>
              )}
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }} onClick={() => navigate('/guides')}>
                View All Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser?.role === 'Administrator') {
    return (
      <div>
        <div className="page-head">
          <div>
            <h1>Unified Admin Dashboard</h1>
            <p>Real-time ecosystem metrics, faculty capacity status, domain requests, and activity monitoring.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => navigate('/admin?tab=domains')}>
              <Icon name="bell" size={16} /> Domain Requests
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/admin')}>
              <Icon name="usercog" size={16} /> Admin Governance Center
            </button>
          </div>
        </div>

        {/* UNIFIED METRICS ROW */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
          <div className="card stat-card">
            <div className="stat-top"><span>Total Students</span><div className="stat-icon"><Icon name="users" size={16} /></div></div>
            <div className="stat-value">{analytics?.activeStudents || 12}</div>
            <div className="stat-sub">registered student accounts</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Faculty Members</span><div className="stat-icon"><Icon name="usercog" size={16} /></div></div>
            <div className="stat-value">{analytics?.facultyCount || 6}</div>
            <div className="stat-sub">active reviewers & guides</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Pending Reviews</span><div className="stat-icon"><Icon name="book" size={16} /></div></div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>{analytics?.pendingReviews || 0}</div>
            <div className="stat-sub">awaiting faculty evaluation</div>
          </div>
          <div className="card stat-card">
            <div className="stat-top"><span>Approved Projects</span><div className="stat-icon"><Icon name="check" size={16} /></div></div>
            <div className="stat-value" style={{ color: '#34d399' }}>{analytics?.approvedProjects || 0}</div>
            <div className="stat-sub">unlocked in repository</div>
          </div>
        </div>

        {/* WORKLOAD & CATEGORY CHARTS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="usercog" size={16} /> Faculty Review Load & Domain Capacities
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
              Workload limits ensure projects are automatically distributed without faculty overload.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr><th>Faculty Expert</th><th>Specializations</th><th>Capacity Limit</th></tr>
                </thead>
                <tbody>
                  {(analytics?.facultyWorkload || [
                    { name: 'Dr. Arumugam Pillai', specializations: ['Machine Learning', 'Cloud Computing'], maxPendingThreshold: 10 },
                    { name: 'Dr. Senthamizhan V', specializations: ['Web Development', 'Cybersecurity'], maxPendingThreshold: 10 },
                    { name: 'Dr. Thenmozhi K', specializations: ['Mobile Development', 'Internet of Things'], maxPendingThreshold: 10 }
                  ]).map((f, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{f.name}</td>
                      <td style={{ color: 'var(--muted)' }}>{(f.specializations || []).join(', ')}</td>
                      <td>
                        <span className="badge badge-gray" style={{ color: '#38bdf8' }}>
                          {f.maxPendingThreshold || 10} pending max
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="chart" size={16} /> Project Submissions by Domain
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {(analytics?.categories || [
                ['Machine Learning', 4, 11],
                ['Web Development', 3, 11],
                ['Mobile Development', 2, 11],
                ['Blockchain', 1, 11],
                ['Internet of Things', 1, 11]
              ]).map(([catName, count, total]) => (
                <div key={catName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#cbd5e1', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{catName}</span>
                    <span style={{ color: 'var(--muted)' }}>{count} projects</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (count / (total || 1)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT SUBMISSIONS & SYSTEM NOTIFICATIONS */}
        <div className="dash-grid">
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: 'var(--text)' }}>Recent Platform Submissions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '16px' }}>
              {recentProjects.map((p) => (
                <div key={p.id} className="card proj-card" onClick={() => navigate('/projects')}>
                  <div className="proj-top">
                    <span className="badge badge-gray">{p.type}</span>
                    <div className="proj-cat">{p.category}</div>
                  </div>
                  <div className="proj-title" style={{ marginTop: '6px' }}>{p.title}</div>
                  <div className="proj-by">by <b>{p.author}</b> &middot; {p.dept}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--text)' }}>System Governance Feed</h3>
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="notif-item" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => handleNotificationClick(n)}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div className="notif-icon"><Icon name={n.icon || 'bell'} size={15} /></div>
                  <div>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time"><Icon name="bell" size={11} /> {n.time || 'Just now'}</div>
                  </div>
                </div>
                <button className="icon-btn" style={{ width: '24px', height: '24px', flexShrink: 0 }} onClick={(e) => handleDeleteNotification(n.id, e)} title="Remove notification">
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  const credits = currentUser?.credits || 0;
  const approvedProjects = currentUser?.approved_projects || 0;
  const meetsProjectFloor = approvedProjects >= 3;

  const accessTiers = [
    { min: 0, label: 'No Repository Access' },
    { min: 60, label: 'Idea Repository' },
    { min: 100, label: 'Internal Projects' },
    { min: 200, label: 'External Projects' }
  ];

  let currentTier = accessTiers[0], nextTier = accessTiers[1];
  for (let i = 0; i < accessTiers.length; i++) {
    if (credits >= accessTiers[i].min) {
      currentTier = accessTiers[i];
      nextTier = accessTiers[i + 1] || null;
    }
  }

  const pct = nextTier ? Math.min(100, Math.round((credits - currentTier.min) / (nextTier.min - currentTier.min) * 100)) : 100;
  const myRankObj = leaderboard.find((s) => s.name === currentUser?.name);
  const myRank = myRankObj ? `#${myRankObj.rank}` : '—';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Welcome back, {currentUser?.name?.split(' ')[0]}</h1>
          <p>Here is what is happening with your projects today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/projects')}>View Projects</button>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            <Icon name="plus" size={16} /> Submit Project
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-top"><span>Credit Points</span><div className="stat-icon"><Icon name="award" size={16} /></div></div>
          <div className="stat-value">{credits}</div>
          <div className="stat-sub"><span className="up-inline">+15</span> this week</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Approved Projects</span><div className="stat-icon"><Icon name="folder" size={16} /></div></div>
          <div className="stat-value">{approvedProjects}</div>
          <div className="stat-sub">active portfolio builds</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Published Ideas</span><div className="stat-icon"><Icon name="bulb" size={16} /></div></div>
          <div className="stat-value">3</div>
          <div className="stat-sub">active ideas showcase</div>
        </div>
        <div className="card stat-card">
          <div className="stat-top"><span>Leaderboard Rank</span><div className="stat-icon"><Icon name="trophy" size={16} /></div></div>
          <div className="stat-value">{myRank}</div>
          <div className="stat-sub up">live rank in department</div>
        </div>
      </div>

      <div className="card" style={{ padding: '22px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Repository Access Progress</h3>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Requires 3+ approved projects &middot; you have {approvedProjects} {meetsProjectFloor ? <Icon name="check" size={13} /> : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
              <span>Current access level</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentTier.label}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${meetsProjectFloor ? pct : 0}%` }}></div>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '10px' }}>
              {!meetsProjectFloor ? (
                <span style={{ color: '#f43f5e', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="alert" size={13} /> You must have at least 3 approved projects to unlock repositories.
                </span>
              ) : nextTier ? (
                `You need ${nextTier.min} credits to unlock ${nextTier.label}. You are ${nextTier.min - credits} credits away.`
              ) : (
                'You have unlocked every repository tier.'
              )}
            </div>
          </div>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--gray-bg)', border: 'none', boxShadow: 'none' }}>
            <Icon name="trend" size={18} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{credits}{nextTier ? ` / ${nextTier.min}` : ''}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>credits {nextTier ? 'for next tier' : '— max tier'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          {accessTiers.map((t, idx) => {
            const unlocked = credits >= t.min && meetsProjectFloor;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: unlocked ? 'var(--text)' : 'var(--muted-2)', fontWeight: unlocked ? 600 : 400 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: unlocked ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}></span>
                {t.label} <span style={{ color: 'var(--muted-2)' }}>({t.min}+)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text)' }}>Recent Projects</h3>
            <a onClick={() => navigate('/projects')} style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              View all <Icon name="arrow" size={14} />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '16px' }}>
            {recentProjects.map((p) => (
              <div key={p.id} className="card proj-card" onClick={() => navigate('/projects')}>
                <div className="proj-top">
                  <span className="badge badge-gray">{p.type}</span>
                  <div className="proj-cat">{p.category}</div>
                </div>
                <div className="proj-title" style={{ marginTop: '6px' }}>{p.title}</div>
                <div className="proj-by">by <b>{p.author}</b> &middot; {p.dept}</div>
                <div className="proj-stats" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                  <span><Icon name="heart" size={15} /> {p.likes}</span>
                  <span><Icon name="comment" size={15} /> {p.commentsCount || (p.comments ? p.comments.length : 0)}</span>
                  <span><Icon name="eye" size={15} /> {p.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--text)' }}>Notifications</h3>
            {notifications.length ? notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="notif-item" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => handleNotificationClick(n)}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div className="notif-icon"><Icon name={n.icon || 'star'} size={15} /></div>
                  <div>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time"><Icon name="bell" size={11} /> {n.time || 'Just now'}</div>
                  </div>
                </div>
                <button className="icon-btn" style={{ width: '24px', height: '24px', flexShrink: 0 }} onClick={(e) => handleDeleteNotification(n.id, e)} title="Remove notification">
                  <Icon name="x" size={13} />
                </button>
              </div>
            )) : (
              <p style={{ fontSize: '12.5px', color: 'var(--muted-2)', margin: '10px 0 0 0' }}>No new notifications.</p>
            )}
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--text)' }}>Leaderboard</h3>
            {leaderboard.slice(0, 4).map((s) => (
              <div key={s.rank} className="lb-row">
                <div className={`lb-badge ${s.rank === 1 ? 'gold' : ''}`}>{s.rank}</div>
                <div style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }} className="clickable-name" onClick={() => navigate(`/profile?name=${encodeURIComponent(s.name)}`)}>
                  {s.name}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{s.credits}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--muted-2)' }}>{s.projects} projects</div>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '14px', justifyContent: 'center' }} onClick={() => navigate('/leaderboard')}>
              <Icon name="trophy" size={14} /> View Full Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
