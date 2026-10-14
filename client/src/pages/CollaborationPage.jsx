import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import RandomFillButton from '../components/common/RandomFillButton';

export default function CollaborationPage() {
  const { currentUser } = useAuth();
  const { showToast } = useApp();

  const [myCollabs, setMyCollabs] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjId, setSelectedProjId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collaboration');
      if (res.data.success) {
        setMyCollabs(res.data.myCollabs);
        setIncoming(res.data.incoming);
        setOutgoing(res.data.outgoing);
        setAvailableProjects(res.data.availableProjects);
      }
    } catch (err) {
      console.error('Fetch collaborations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomSelectProject = () => {
    if (availableProjects && availableProjects.length > 0) {
      const randomProj = availableProjects[Math.floor(Math.random() * availableProjects.length)];
      setSelectedProjId(randomProj.id);
      showToast(`Auto-selected: "${randomProj.title}"`);
    } else {
      showToast('No available projects to select.');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjId) return;
    try {
      const res = await api.post('/collaboration/request', { projectId: selectedProjId });
      if (res.data.success) {
        showToast(res.data.message);
        setSelectedProjId('');
        fetchCollaborations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Collaboration request failed');
    }
  };

  const handleRespond = async (reqId, accept) => {
    try {
      const res = await api.post('/collaboration/respond', { reqId, accept });
      if (res.data.success) {
        showToast(res.data.message);
        fetchCollaborations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Response failed');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading Collaboration Center...</div>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Collaboration Center</h1>
          <p>Work together on projects, share credit, and manage contributor access.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '22px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: 'var(--text)' }}>Your Team Projects</h3>
        {myCollabs.length ? (
          <table>
            <thead>
              <tr><th>Project</th><th>Your Role</th><th>Collaborators</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {myCollabs.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.title}</td>
                  <td><span className={`badge ${c.role === 'Owner' ? 'badge-green' : 'badge-blue'}`}>{c.role}</span></td>
                  <td>{c.collaborators.length ? c.collaborators.join(', ') : 'None'}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Invite link copied to clipboard!')}>Invite</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>You are not currently collaborating on any projects.</p>
        )}
      </div>

      {incoming.length > 0 && (
        <div className="card" style={{ padding: '22px', marginBottom: '20px', borderColor: 'var(--accent)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="users" size={18} /> Incoming Collaboration Requests
          </h3>
          <table>
            <thead>
              <tr><th>Project</th><th>Requester</th><th>Action</th></tr>
            </thead>
            <tbody>
              {incoming.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.projectTitle}</td>
                  <td><span className="clickable-name">{r.requester}</span></td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRespond(r.id, true)}>Accept</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => handleRespond(r.id, false)}>Decline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dash-grid">
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text)' }}>Request Access to a Project</h3>
            <RandomFillButton onFill={handleRandomSelectProject} label="Random Select" />
          </div>
          <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: '13px' }}>Propose to collaborate on an existing approved academic project.</p>
          <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="field" style={{ margin: 0 }}>
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value)}
                required
              >
                <option value="" disabled>Select an approved project...</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} (by {p.author})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              <Icon name="users" size={16} /> Request Collaboration Access
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: 'var(--text)' }}>Your Sent Requests</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px' }}>
            {outgoing.length ? outgoing.map((r) => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.projectTitle}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Owner: {r.owner}</div>
                </div>
                <span className={`badge ${r.status === 'Accepted' ? 'badge-green' : r.status === 'Declined' ? 'badge-amber' : 'badge-blue'}`}>{r.status}</span>
              </div>
            )) : (
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>No collaboration requests sent.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
