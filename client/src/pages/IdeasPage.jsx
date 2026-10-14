import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import { BadgeType } from '../components/common/Badge';
import { EmptyState } from '../components/common/Toast';
import RandomFillButton from '../components/common/RandomFillButton';
import { getRandomIdea } from '../utils/mockDataGenerator';

export default function IdeasPage() {
  const { currentUser } = useAuth();
  const { showToast } = useApp();

  const [ideas, setIdeas] = useState([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tech, setTech] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects?filter=idea');
      if (res.data.success) {
        setIdeas(res.data.projects);
      }
    } catch (err) {
      console.error('Fetch ideas error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillIdea = () => {
    const mock = getRandomIdea();
    setTitle(mock.title);
    setCategory('Machine Learning & IoT');
    setTech(mock.tags);
    setDescription(mock.description);
    showToast('Auto-filled idea form with creative academic concept!');
  };

  const handlePublishIdea = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects/ideas', { title, category, tech, description });
      if (res.data.success) {
        showToast(res.data.message);
        setModal(false);
        setTitle(''); setCategory(''); setTech(''); setDescription('');
        fetchIdeas();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish idea');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Idea Showcase</h1>
          <p>Publish project ideas before implementation and earn credit points.</p>
        </div>
        {currentUser?.role === 'Student' && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Icon name="plus" size={16} /> Publish Idea
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '34px 20px', textAlign: 'center', marginBottom: '22px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gray-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--accent)', boxShadow: '0 0 15px rgba(99,102,241,0.15)' }}>
          <Icon name="bulb" size={20} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--text)' }}>Have an idea? Share it first.</h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px' }}>Ideas do not require faculty approval. Once published, peers can view, comment, and collaborate.</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading ideas...</div>
      ) : ideas.length ? (
        <div className="proj-grid">
          {ideas.map((p) => (
            <div key={p.id} className="card proj-card">
              <div className="proj-top">
                <BadgeType type={p.type} />
                <div className="proj-cat">{p.category}</div>
              </div>
              <div className="proj-title" style={{ marginTop: '6px' }}>{p.title}</div>
              <div className="proj-by">by <span className="clickable-name">{p.author}</span> &middot; {p.dept}</div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '8px 0', lineHeight: 1.5 }}>
                {p.abstract || p.description}
              </p>
              <div className="proj-stats" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
                <span><Icon name="heart" size={15} /> {p.likes}</span>
                <span><Icon name="comment" size={15} /> {p.commentsCount || (p.comments ? p.comments.length : 0)}</span>
                <span><Icon name="eye" size={15} /> {p.views}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState msg="No ideas published yet." ic="bulb" />
      )}

      {/* MODAL: PUBLISH IDEA */}
      {modal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Publish Idea</h3>
              <RandomFillButton onFill={handleAutoFillIdea} label="Test Auto-Fill" />
            </div>
            <p className="hint">Ideas go live instantly — no faculty approval needed.</p>
            <form onSubmit={handlePublishIdea}>
              <div className="field"><label>Idea title</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus Micro-Grid Energy Exchange" /></div>
              <div className="field"><label>Domain</label><input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. CleanTech, Machine Learning" /></div>
              <div className="field"><label>Technologies (comma separated)</label><input required value={tech} onChange={(e) => setTech(e.target.value)} placeholder="e.g. IoT, Solidity, React" /></div>
              <div className="field"><label>Description</label><textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What problem does this solve and how?"></textarea></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish idea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
