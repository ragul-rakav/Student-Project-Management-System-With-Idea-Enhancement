import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState([]);
  const [modal, setModal] = useState(null); // 'publish' | 'detail'
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  // Publish Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tech, setTech] = useState('');
  const [description, setDescription] = useState('');

  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      if (ideas.length === 0) setLoading(true);
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
        setModal(null);
        setTitle(''); setCategory(''); setTech(''); setDescription('');
        fetchIdeas();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish idea');
    }
  };

  const handleCardClick = async (idea) => {
    try {
      const res = await api.get(`/projects/${idea.id}`);
      if (res.data.success) {
        setSelectedIdea(res.data.project);
        setModal('detail');
      }
    } catch (err) {
      setSelectedIdea(idea);
      setModal('detail');
    }
  };

  const handleToggleLike = async (e, idea) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/projects/${idea.id}/like`);
      if (res.data.success) {
        const updatedLikes = res.data.likes;
        const updatedLiked = res.data.liked;

        setIdeas((prev) =>
          prev.map((item) =>
            item.id === idea.id ? { ...item, likes: updatedLikes, liked: updatedLiked } : item
          )
        );

        if (selectedIdea && selectedIdea.id === idea.id) {
          setSelectedIdea((prev) => ({ ...prev, likes: updatedLikes, liked: updatedLiked }));
        }
      }
    } catch (err) {
      showToast('Like action failed');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedIdea) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/projects/${selectedIdea.id}/comments`, { text: commentText.trim() });
      if (res.data.success) {
        const newComment = res.data.comment;
        const newCount = res.data.commentsCount;

        // Instantly update selectedIdea in modal
        setSelectedIdea((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), newComment],
          commentsCount: newCount
        }));

        // Instantly update ideas list array so grid card updates immediately
        setIdeas((prev) =>
          prev.map((item) =>
            item.id === selectedIdea.id
              ? {
                  ...item,
                  commentsCount: newCount,
                  comments: [...(item.comments || []), newComment]
                }
              : item
          )
        );

        setCommentText('');
        showToast('Comment posted successfully');
      }
    } catch (err) {
      showToast('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleForkIdeaToProject = (idea) => {
    setModal(null);
    navigate('/projects', {
      state: {
        draft: {
          title: idea.title,
          category: idea.category,
          tech: Array.isArray(idea.tech) ? idea.tech.join(', ') : (idea.tech || ''),
          abstract: `Continuation build developed from published Idea: "${idea.title}". Original concept proposed by ${idea.author}.\n\nConcept Description:\n${idea.abstract || idea.description || ''}`
        }
      }
    });
    showToast(`Initializing project proposal from idea "${idea.title}"`);
  };

  const handleRequestCollab = async (idea) => {
    try {
      const res = await api.post('/collaboration/request', { projectId: idea.id });
      if (res.data.success) {
        showToast(`Collaboration request sent to ${idea.author}!`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Collaboration request failed');
    }
  };

  const handleDeleteIdea = async (e, ideaId) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    try {
      const res = await api.delete(`/projects/${ideaId}`);
      if (res.data.success) {
        showToast(res.data.message);
        setModal(null);
        setSelectedIdea(null);
        setIdeas((prev) => prev.filter((item) => item.id !== ideaId));
      }
    } catch (err) {
      showToast('Delete idea failed');
    }
  };

  // Filter ideas based on debounced search and domain filter
  const filteredIdeas = ideas.filter((item) => {
    if (domainFilter !== 'all' && item.category?.toLowerCase() !== domainFilter.toLowerCase()) {
      return false;
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const techStr = Array.isArray(item.tech) ? item.tech.join(' ').toLowerCase() : (item.tech || '').toLowerCase();
      const text = `${item.title} ${item.author} ${item.category} ${item.dept} ${techStr} ${item.description || item.abstract}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const uniqueDomains = Array.from(new Set(ideas.map((i) => i.category).filter(Boolean)));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Idea Showcase & Concept Incubator</h1>
          <p>Publish project concepts before implementation, discover peer ideas, and collaborate on novel solutions.</p>
        </div>
        {currentUser?.role === 'Student' && (
          <button className="btn btn-primary" onClick={() => setModal('publish')}>
            <Icon name="plus" size={16} /> Publish Idea (+5 Credits)
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '24px 20px', textAlign: 'center', marginBottom: '22px', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gray-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--accent)', boxShadow: '0 0 15px rgba(99,102,241,0.15)' }}>
          <Icon name="bulb" size={20} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--text)' }}>Have a novel idea? Share it first.</h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px' }}>
          Ideas do not require faculty pre-approval. Once published, peers can review, like, comment, and collaborate to turn concepts into full projects.
        </p>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: '220px' }}>
            <Icon name="search2" size={16} />
            <input
              className="search-input"
              placeholder="Search idea title, student, domain, tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="field"
            style={{ width: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', background: '#0f172a', color: '#fff', margin: 0 }}
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="all">All Domains ({ideas.length})</option>
            {uniqueDomains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '40px', textAlign: 'center' }}>Loading ideas...</div>
      ) : filteredIdeas.length ? (
        <div className="proj-grid">
          {filteredIdeas.map((p) => (
            <div
              key={p.id}
              className="card proj-card"
              onClick={() => handleCardClick(p)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            >
              <div className="proj-top">
                <BadgeType type={p.type} />
                <div className="proj-cat">{p.category}</div>
              </div>
              <div className="proj-title" style={{ marginTop: '6px' }}>{p.title}</div>
              <div className="proj-by">
                by <span
                  className="clickable-name"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile?name=${encodeURIComponent(p.author)}`);
                  }}
                >{p.author}</span> &middot; {p.dept || 'Engineering'}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '8px 0', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.abstract || p.description}
              </p>

              {p.tech && (Array.isArray(p.tech) ? p.tech.length > 0 : p.tech) && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '6px 0 10px' }}>
                  {(Array.isArray(p.tech) ? p.tech : p.tech.split(',')).slice(0, 3).map((t, i) => (
                    <span key={i} className="badge badge-gray" style={{ fontSize: '11px', padding: '2px 7px' }}>
                      {typeof t === 'string' ? t.trim() : t}
                    </span>
                  ))}
                  {(Array.isArray(p.tech) ? p.tech.length : p.tech.split(',').length) > 3 && (
                    <span className="badge badge-gray" style={{ fontSize: '11px', padding: '2px 7px' }}>
                      +{(Array.isArray(p.tech) ? p.tech.length : p.tech.split(',').length) - 3}
                    </span>
                  )}
                </div>
              )}

              <div
                className="proj-stats"
                style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <button
                  type="button"
                  className="icon-btn"
                  onClick={(e) => handleToggleLike(e, p)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: p.liked ? '#f43f5e' : 'var(--muted)',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '6px'
                  }}
                  title={p.liked ? 'Liked' : 'Like this idea'}
                >
                  <Icon name={p.liked ? 'heartFilled' : 'heart'} size={15} />
                  <span>{p.likes || 0}</span>
                </button>

                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--muted)', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(p);
                  }}
                  title="View comments"
                >
                  <Icon name="comment" size={15} />
                  <span>{p.commentsCount || (p.comments ? p.comments.length : 0)}</span>
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--muted)' }} title="Views">
                  <Icon name="eye" size={15} />
                  <span>{p.views || 0}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState msg="No ideas match your search criteria." ic="bulb" />
      )}

      {/* MODAL: DETAIL IDEA */}
      {modal === 'detail' && selectedIdea && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div className="proj-badges" style={{ marginBottom: '6px' }}>
                  <BadgeType type="Idea" />
                  <span className="badge badge-gray">{selectedIdea.category}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', lineHeight: 1.25, color: 'var(--text)' }}>{selectedIdea.title}</h3>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                  by <span
                    className="clickable-name"
                    onClick={() => {
                      setModal(null);
                      navigate(`/profile?name=${encodeURIComponent(selectedIdea.author)}`);
                    }}
                  >{selectedIdea.author}</span> &middot; {selectedIdea.dept || 'Engineering'}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)} title="Close"><Icon name="x" size={20} /></button>
            </div>

            <div style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '18px' }}>
              <b>Concept Description:</b><br />
              {selectedIdea.abstract || selectedIdea.description || 'No description provided.'}
            </div>

            {selectedIdea.tech && (Array.isArray(selectedIdea.tech) ? selectedIdea.tech.length > 0 : selectedIdea.tech) && (
              <div style={{ marginBottom: '18px' }}>
                <b>Suggested Technologies:</b>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {(Array.isArray(selectedIdea.tech) ? selectedIdea.tech : selectedIdea.tech.split(',')).map((t, idx) => (
                    <span key={idx} className="badge badge-gray">{typeof t === 'string' ? t.trim() : t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* INTERACTIVE LIKE AND STATS ROW */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={(e) => handleToggleLike(e, selectedIdea)}
                style={{
                  color: selectedIdea.liked ? '#f43f5e' : 'var(--text)',
                  borderColor: selectedIdea.liked ? '#f43f5e' : 'var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon name={selectedIdea.liked ? 'heartFilled' : 'heart'} size={15} />
                <span>{selectedIdea.liked ? 'Liked' : 'Like Concept'} ({selectedIdea.likes || 0})</span>
              </button>

              <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="comment" size={15} />
                <span>{selectedIdea.commentsCount || (selectedIdea.comments ? selectedIdea.comments.length : 0)} comments</span>
              </span>

              <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="eye" size={15} />
                <span>{selectedIdea.views || 0} views</span>
              </span>
            </div>

            {/* ACTION BUTTONS: FORK, COLLABORATE, DELETE */}
            <div className="modal-actions" style={{ marginTop: '14px', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {currentUser?.role === 'Student' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleForkIdeaToProject(selectedIdea)}>
                    <Icon name="plus" size={14} /> Fork &amp; Develop into Project
                  </button>
                )}

                {currentUser?.role === 'Student' && currentUser?.name !== selectedIdea.author && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleRequestCollab(selectedIdea)}>
                    <Icon name="users" size={14} /> Request Collaboration
                  </button>
                )}

                {(currentUser?.name === selectedIdea.author || currentUser?.role === 'Administrator') && (
                  <button className="btn btn-danger-outline btn-sm" onClick={(e) => handleDeleteIdea(e, selectedIdea.id)}>
                    <Icon name="trash" size={14} /> Delete Idea
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Close</button>
            </div>

            {/* LIVE COMMENTS SECTION */}
            <div className="comment-section" style={{ marginTop: '18px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <span>Discussion &amp; Feedback ({selectedIdea.comments ? selectedIdea.comments.length : 0})</span>
              </div>

              <div className="comment-list" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedIdea.comments && selectedIdea.comments.length ? (
                  selectedIdea.comments.map((c, idx) => (
                    <div key={idx} className="comment-bubble" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <div className="comment-author" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{c.author}</span>
                        <span className="comment-time" style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>{c.time || 'Just now'}</span>
                      </div>
                      <div className="comment-text" style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45 }}>{c.text}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, padding: '10px 0' }}>No comments on this idea yet. Start the conversation!</p>
                )}
              </div>

              {currentUser && (
                <form className="comment-form" onSubmit={handlePostComment} style={{ marginTop: '12px' }}>
                  <textarea
                    required
                    rows="2"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share feedback, technical suggestions, or mentorship notes..."
                    style={{ width: '100%', marginBottom: '8px', borderRadius: '8px', padding: '8px 12px', background: 'var(--dropdown-bg)', color: '#fff', border: '1px solid var(--border)' }}
                  ></textarea>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !commentText.trim()}>
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH IDEA */}
      {modal === 'publish' && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Publish Idea</h3>
              <RandomFillButton onFill={handleAutoFillIdea} label="Test Auto-Fill" />
            </div>
            <p className="hint">Ideas go live instantly — no faculty approval needed. Earn +5 credits immediately.</p>
            <form onSubmit={handlePublishIdea}>
              <div className="field">
                <label>Idea title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus Micro-Grid Energy Exchange" />
              </div>
              <div className="field">
                <label>Domain</label>
                <input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. CleanTech, Machine Learning" />
              </div>
              <div className="field">
                <label>Technologies (comma separated)</label>
                <input required value={tech} onChange={(e) => setTech(e.target.value)} placeholder="e.g. IoT, Solidity, React" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea required rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What problem does this solve and how?"></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish idea (+5 credits)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
