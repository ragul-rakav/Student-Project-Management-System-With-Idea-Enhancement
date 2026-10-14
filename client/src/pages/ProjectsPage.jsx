import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import { BadgeType, BadgeStatus } from '../components/common/Badge';
import { EmptyState } from '../components/common/Toast';
import RandomFillButton from '../components/common/RandomFillButton';
import { getRandomProject, getRandomEnhancement, getRandomReport } from '../utils/mockDataGenerator';

const accessTiers = [
  { min: 0, label: 'No Repository Access' },
  { min: 60, label: 'Idea Repository' },
  { min: 100, label: 'Internal Projects' },
  { min: 200, label: 'External Projects' }
];

function validateUrl(str) {
  if (!str || !str.trim()) return true;
  const s = str.trim();
  if (s.includes(' ') || s.length < 3) return false;
  return true;
}

export default function ProjectsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [loading, setLoading] = useState(true);

  // Modals
  const [modal, setModal] = useState(null); // 'submit' | 'locked' | 'detail' | 'enhancement' | 'report'
  const [submitType, setSubmitType] = useState('Internal');
  const [selectedProject, setSelectedProject] = useState(null);
  const [lockedInfo, setLockedInfo] = useState({ type: '', req: 60 });
  const [commentText, setCommentText] = useState('');

  // Submit form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Machine Learning');
  const [tech, setTech] = useState('');
  const [abstract, setAbstract] = useState('');
  const [github, setGithub] = useState('');
  const [doc, setDoc] = useState('');
  const [ppt, setPpt] = useState('');
  const [cert, setCert] = useState('');
  const [demo, setDemo] = useState('');
  const [vercel, setVercel] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Detailed ProjectPulse academic submission fields
  const [problemStatement, setProblemStatement] = useState('');
  const [objectives, setObjectives] = useState('');
  const [methodology, setMethodology] = useState('');

  // AI Originality Pre-check state
  const [checkingOriginality, setCheckingOriginality] = useState(false);
  const [originalityReport, setOriginalityReport] = useState(null);
  const [appliedEnhancementIds, setAppliedEnhancementIds] = useState([]);

  // Inline URL errors
  const [urlErrors, setUrlErrors] = useState({});

  // Report form state
  const [reportCategory, setReportCategory] = useState('Plagiarism / Copyright');
  const [reportReason, setReportReason] = useState('');

  // Enhancement form state
  const [enhTitle, setEnhTitle] = useState('');
  const [enhDetails, setEnhDetails] = useState('');
  const [enhLink, setEnhLink] = useState('');

  const [domainFilter, setDomainFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [customDomainName, setCustomDomainName] = useState('');

  const predefinedDomainList = [
    'Machine Learning',
    'Web Development',
    'Mobile Development',
    'Blockchain',
    'Internet of Things',
    'Cybersecurity',
    'Cloud Computing',
    'Other'
  ];

  useEffect(() => {
    fetchProjects();
  }, [filter, domainFilter, accessFilter, search, sort]);

  const fetchProjects = async () => {
    try {
      if (projects.length === 0) setLoading(true);
      const res = await api.get('/projects', { params: { filter, domain: domainFilter, accessLevel: accessFilter, search, sort } });
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = (p) => {
    if (!currentUser) return true;
    if (currentUser.role !== 'Student') return true;
    if (p.author === currentUser.name) return true;
    if (p.collaborators && p.collaborators.includes(currentUser.name)) return true;

    if ((currentUser.approved_projects || 0) < 3) return false;

    let req = 0;
    if (p.type === 'Idea') req = accessTiers[1].min;
    if (p.type === 'Internal') req = accessTiers[2].min;
    if (p.type === 'External') req = accessTiers[3].min;

    return (currentUser.credits || 0) >= req;
  };

  const handleCardClick = async (p) => {
    if (p.status === 'Domain Verification Pending') {
      showToast('This project is currently awaiting custom domain verification by Administrator.');
      return;
    }

    if (checkAccess(p)) {
      try {
        const res = await api.get(`/projects/${p.id}`);
        if (res.data.success) {
          setSelectedProject(res.data.project);
          setModal('detail');
        }
      } catch (err) {
        setSelectedProject(p);
        setModal('detail');
      }
    } else {
      let req = 60;
      if (p.type === 'Internal') req = accessTiers[2].min;
      if (p.type === 'External') req = accessTiers[3].min;
      setLockedInfo({ type: p.type, req });
      setModal('locked');
    }
  };

  const handleToggleLike = async (e, p) => {
    e.stopPropagation();
    if (!checkAccess(p)) return;
    try {
      const res = await api.post(`/projects/${p.id}/like`);
      if (res.data.success) {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, likes: res.data.likes, liked: res.data.liked } : item
          )
        );
        if (selectedProject?.id === p.id) {
          setSelectedProject((prev) => ({ ...prev, likes: res.data.likes, liked: res.data.liked }));
        }
      }
    } catch (err) {
      showToast('Like action failed');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedProject) return;
    try {
      const res = await api.post(`/projects/${selectedProject.id}/comments`, { text: commentText });
      if (res.data.success) {
        setSelectedProject((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), res.data.comment],
          commentsCount: res.data.commentsCount
        }));
        setCommentText('');
        showToast('Comment posted');
      }
    } catch (err) {
      showToast('Failed to post comment');
    }
  };

  const handleCheckOriginality = async () => {
    if (!title.trim() && !abstract.trim()) {
      showToast('Please provide a project title and abstract before running originality check.');
      return;
    }
    setCheckingOriginality(true);
    try {
      const res = await api.post('/similarity/check', {
        title,
        abstract,
        tech,
        category,
        problem_statement: problemStatement,
        objectives,
        methodology
      });
      if (res.data.success) {
        setOriginalityReport(res.data.report);
        showToast(`Originality analysis complete: ${res.data.report.originalityScore}% Original`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Originality check failed');
    } finally {
      setCheckingOriginality(false);
    }
  };

  const handleAutoFillProject = () => {
    const mock = getRandomProject();
    setTitle(mock.title);
    setCategory(mock.category);
    setTech(mock.tech);
    setAbstract(mock.abstract);
    setProblemStatement(mock.problemStatement);
    setObjectives(mock.objectives);
    setMethodology(mock.methodology);
    setGithub(mock.github);
    setDoc(mock.doc);
    setPpt(mock.ppt);
    setDemo(mock.demo);
    setVercel(mock.vercel);
    setOriginalityReport(null);
    setAppliedEnhancementIds([]);
    showToast('Auto-filled form with realistic academic project data!');
  };

  const handleAutoFillReport = () => {
    const mock = getRandomReport();
    setReportCategory(mock.category);
    setReportReason(mock.reason);
    showToast('Auto-filled violation report form!');
  };

  const handleAutoFillEnhancement = () => {
    const mock = getRandomEnhancement();
    setEnhTitle(mock.title);
    setEnhDetails(mock.details);
    setEnhLink(mock.link);
    showToast('Auto-filled enhancement proposal form!');
  };

  const handleApplyEnhancementSuggestion = (suggestion) => {
    setAppliedEnhancementIds(prev => [...prev, suggestion.id]);
    if (suggestion.techAddition) {
      setTech(prev => {
        const currentList = prev ? prev.split(',').map(s => s.trim().toLowerCase()) : [];
        const additions = suggestion.techAddition.split(',').map(s => s.trim()).filter(Boolean);
        const newToAdd = additions.filter(a => !currentList.includes(a.toLowerCase()));
        if (newToAdd.length === 0) return prev;
        return prev ? `${prev}, ${newToAdd.join(', ')}` : newToAdd.join(', ');
      });
    }
    const extSnippet = `\n[Novel Enhancement: ${suggestion.title}. ${suggestion.description}]`;
    setAbstract(prev => prev.includes(suggestion.title) ? prev : prev + extSnippet);
    if (methodology) {
      setMethodology(prev => prev.includes(suggestion.title) ? prev : `${prev}\nNovelty Implementation: ${suggestion.description}`);
    } else {
      setMethodology(`Novelty Implementation: ${suggestion.description}`);
    }
    // Filter out applied enhancement immediately from current report
    setOriginalityReport(prev => {
      if (!prev) return null;
      const recs = prev.enhancementSuggestions?.recommendations || [];
      return {
        ...prev,
        enhancementSuggestions: {
          ...prev.enhancementSuggestions,
          recommendations: recs.filter(r => r.id !== suggestion.id)
        }
      };
    });
    showToast(`Applied: "${suggestion.title}". Re-check originality to verify new score.`);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();

    if (originalityReport && (originalityReport.originalityScore < 20 || originalityReport.isDirectDuplicate)) {
      showToast('Submission blocked: Originality score is below the 20% required threshold. Please use the AI Idea Enhancement recommendations to differentiate your project.');
      return;
    }

    if (category === 'Other' && !customDomainName.trim()) {
      showToast('Please specify your proposed custom domain name.');
      return;
    }

    // Inline URL validation check
    const errors = {};
    if (github && !validateUrl(github)) errors.github = 'Invalid URL format (e.g. https://github.com/...)';
    if (doc && !validateUrl(doc)) errors.doc = 'Invalid URL format (e.g. https://docs.google.com/...)';
    if (ppt && !validateUrl(ppt)) errors.ppt = 'Invalid URL format (e.g. https://docs.google.com/...)';
    if (cert && !validateUrl(cert)) errors.cert = 'Invalid URL format (e.g. https://certs.com/...)';
    if (demo && !validateUrl(demo)) errors.demo = 'Invalid URL format (e.g. https://youtube.com/...)';
    if (vercel && !validateUrl(vercel)) errors.vercel = 'Invalid URL format (e.g. https://my-app.vercel.app)';

    if (Object.keys(errors).length > 0) {
      setUrlErrors(errors);
      return;
    }

    setUrlErrors({});

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('customDomainName', customDomainName);
      formData.append('tech', tech);
      formData.append('abstract', abstract);
      formData.append('problemStatement', problemStatement);
      formData.append('objectives', objectives);
      formData.append('methodology', methodology);
      formData.append('github', github);
      formData.append('doc', doc);
      formData.append('ppt', ppt);
      formData.append('cert', cert);
      formData.append('demo', demo);
      formData.append('vercel', vercel);
      formData.append('type', submitType);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const res = await api.post('/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast(res.data.message);
        setModal(null);
        resetSubmitForm();
        fetchProjects();
      }
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.isDuplicate) {
        if (err.response?.data?.matchedProjects) {
          setOriginalityReport({
            originalityScore: Math.max(0, 100 - (err.response.data.similarityScore || 90)),
            similarityScore: err.response.data.similarityScore || 90,
            riskLevel: 'Critical (Duplicate Blocked)',
            isDirectDuplicate: true,
            matchedProjects: err.response.data.matchedProjects
          });
        }
        showToast(err.response?.data?.message || 'Direct duplicate project blocked by platform policy.');
      } else {
        showToast(err.response?.data?.message || 'Submission failed');
      }
    }
  };

  const resetSubmitForm = () => {
    setTitle(''); setCategory('Machine Learning'); setCustomDomainName(''); setTech(''); setAbstract('');
    setProblemStatement(''); setObjectives(''); setMethodology('');
    setGithub(''); setDoc(''); setPpt(''); setCert(''); setDemo(''); setVercel('');
    setSelectedFiles([]); setUrlErrors({}); setOriginalityReport(null); setCheckingOriginality(false);
  };


  const handleOpenReportModal = (e) => {
    e.stopPropagation();
    setModal('report');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!reportReason.trim()) {
      showToast('Please provide a reason for the report');
      return;
    }
    try {
      const res = await api.post(`/projects/${selectedProject.id}/report`, {
        category: reportCategory,
        reason: reportReason
      });
      if (res.data.success) {
        showToast(res.data.message);
        setModal(null);
        setReportReason('');
      }
    } catch (err) {
      showToast('Report submission failed');
    }
  };

  const handleOpenCloneModal = (e, project) => {
    if (e) e.stopPropagation();
    setSelectedProject(project);
    setModal('clone');
  };

  const handleCopyCloneCmd = async (project) => {
    const gitUrl = project?.github || `https://github.com/campus/${(project?.title || 'repo').toLowerCase().replace(/\s+/g, '-')}`;
    const cmd = `git clone ${gitUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
    }
    showToast(`Copied: "${cmd}"`);
    try {
      await api.post(`/projects/${project.id}/clone`);
      fetchProjects();
    } catch (err) {}
  };

  const handleForkProjectDraft = async (project) => {
    resetSubmitForm();
    setTitle(`Fork: ${project.title}`);
    setCategory(project.category || 'Web Development');
    setTech(Array.isArray(project.tech) ? project.tech.join(', ') : (project.tech || ''));
    setAbstract(`Forked / Continuation build of "${project.title}" by ${project.author}.\nOriginal Repository: ${project.github || 'N/A'}`);
    setGithub(project.github || '');
    setModal('submit');
    showToast(`Initialized project draft from ${project.title}`);
    try {
      await api.post(`/projects/${project.id}/clone`);
      fetchProjects();
    } catch (err) {}
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/projects/${projectId}`);
      if (res.data.success) {
        showToast(res.data.message);
        setModal(null);
        fetchProjects();
      }
    } catch (err) {
      showToast('Delete project failed');
    }
  };

  const handleRequestCollab = async (projectId) => {
    try {
      const res = await api.post('/collaboration/request', { projectId });
      if (res.data.success) {
        showToast('Collaboration request sent!');
        setModal(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Collaboration request failed');
    }
  };

  const handleSubmitEnhancement = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await api.post('/collaboration/enhancements', {
        projectId: selectedProject.id,
        title: enhTitle,
        details: enhDetails,
        codeLink: enhLink
      });
      if (res.data.success) {
        showToast(res.data.message);
        setModal(null);
        setEnhTitle(''); setEnhDetails(''); setEnhLink('');
      }
    } catch (err) {
      showToast('Enhancement submission failed');
    }
  };

  const tabs = [['all', 'All'], ['internal', 'Internal'], ['external', 'External'], ['idea', 'Ideas']];
  const sortOptions = [
    ['popular', 'Popular'],
    ['latest', 'Latest'],
    ['views', 'Most Viewed'],
    ['credits', 'Highest Credits']
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Projects Repository</h1>
          <p>Browse internal, external, and idea submissions across the platform.</p>
        </div>
        {(currentUser?.role === 'Student' || currentUser?.role === 'Administrator') && (
          <button className="btn btn-primary" onClick={() => { resetSubmitForm(); setSubmitType('Internal'); setModal('submit'); }}>
            <Icon name="plus" size={16} /> Submit Project
          </button>
        )}
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="tabs">
          {tabs.map(([id, label]) => (
            <div key={id} className={`tab ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="field"
            style={{ width: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', background: '#0f172a', color: '#fff', margin: 0 }}
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="all">Domain: All Domains</option>
            {predefinedDomainList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="field"
            style={{ width: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', background: '#0f172a', color: '#fff', margin: 0 }}
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
          >
            <option value="all">Access: All Projects</option>
            <option value="unlocked">Access: Unlocked Only</option>
            <option value="locked">Access: Locked Only</option>
          </select>

          <div className="search-wrap">
            <Icon name="search2" size={16} />
            <input
              className="search-input"
              placeholder="Search title, student, dept, tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="field"
            style={{ width: 'auto', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', background: '#0f172a', color: '#fff', margin: 0 }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {sortOptions.map(([v, l]) => (
              <option key={v} value={v} style={{ background: '#0f172a', color: '#fff' }}>Sort: {l}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading projects...</div>
      ) : projects.length ? (
        <div className="proj-grid">
          {projects.map((p) => {
            const hasAccess = checkAccess(p);
            const isDomainPending = (p.status === 'Domain Verification Pending');
            return (
              <div
                key={p.id}
                className={`card proj-card${hasAccess ? '' : ' locked'}`}
                onClick={() => handleCardClick(p)}
                style={{
                  position: 'relative',
                  opacity: isDomainPending ? 0.75 : 1,
                  border: isDomainPending ? '1px dashed #f59e0b' : undefined,
                  background: isDomainPending ? 'rgba(245, 158, 11, 0.04)' : undefined
                }}
              >
                {!hasAccess && !isDomainPending && (
                  <div className="lock-overlay-icon">
                    <Icon name="lock" size={14} />
                  </div>
                )}
                <div className="proj-top">
                  <div className="proj-badges">
                    <BadgeType type={p.type} />
                    {isDomainPending ? (
                      <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '10.5px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', height: '22px' }}>
                        <Icon name="clock" size={11} /> Domain Approval Pending
                      </span>
                    ) : (
                      <BadgeStatus status={p.status} />
                    )}
                  </div>
                  <div className="proj-cat" style={{ marginRight: '20px' }}>{p.category}</div>
                </div>
                <div className="proj-title" style={{ marginTop: '6px' }}>{p.title}</div>
                <div className="proj-by">
                  by <span
                    className="clickable-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile?name=${encodeURIComponent(p.author)}`);
                    }}
                  >{p.author}</span> &middot; {p.dept}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {(p.tech || []).map((t, idx) => (
                    <span key={idx} className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 5px' }}>{t}</span>
                  ))}
                </div>
                <div className="proj-stats" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className={p.liked ? 'liked' : ''} onClick={(e) => handleToggleLike(e, p)}>
                      <Icon name={p.liked ? 'heartFilled' : 'heart'} size={15} /> {p.likes}
                    </button>
                    <span><Icon name="comment" size={15} /> {p.commentsCount || (p.comments ? p.comments.length : 0)}</span>
                    <span><Icon name="eye" size={15} /> {p.views}</span>
                    <span title="Project Clones / Forks"><Icon name="folder" size={15} /> {p.clones || p.clonesCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {hasAccess && !isDomainPending && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '11.5px', height: '26px' }}
                        onClick={(e) => handleOpenCloneModal(e, p)}
                        title="Clone or Fork Project"
                      >
                        <Icon name="folder" size={13} /> Clone
                      </button>
                    )}
                    {currentUser?.role === 'Administrator' && (
                      <button
                        className="btn btn-danger-outline btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px', height: '26px' }}
                        onClick={(e) => handleDeleteProject(e, p.id)}
                        title="Admin: Remove project"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState msg="No projects match your search criteria." ic="search2" />
      )}

      {/* MODAL: SUBMIT PROJECT */}
      {modal === 'submit' && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '560px', maxWidth: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Submit Project</h3>
              <RandomFillButton onFill={handleAutoFillProject} label="Test Auto-Fill" />
            </div>
            <p className="hint">
              {submitType === 'Internal'
                ? 'Internal academic projects are automatically evaluated for originality and assigned to an eligible faculty reviewer.'
                : 'External projects undergo similarity analysis and send a guide request to an eligible domain faculty member.'}
            </p>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              <div className={`tab ${submitType === 'Internal' ? 'active' : ''}`} onClick={() => setSubmitType('Internal')}>Internal Project</div>
              <div className={`tab ${submitType === 'External' ? 'active' : ''}`} onClick={() => setSubmitType('External')}>External Project</div>
            </div>
            <form onSubmit={handleSubmitProject}>
              <div className="field"><label>Project title</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Smart Attendance Tracker" /></div>
              
              <div className="field">
                <label>Domain / Category</label>
                <select
                  className="field"
                  style={{ width: '100%', background: 'var(--dropdown-bg)', color: 'var(--text)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {predefinedDomainList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div className="field" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <label style={{ color: '#fbbf24', fontWeight: 600 }}>Specify Proposed Custom Domain</label>
                  <input
                    required
                    value={customDomainName}
                    onChange={(e) => setCustomDomainName(e.target.value)}
                    placeholder="e.g. Quantum Computing Simulators"
                  />
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                    ℹ️ Custom domains require Administrator verification before entering faculty review.
                  </div>
                </div>
              )}

              <div className="field"><label>Technologies (comma separated)</label><input required value={tech} onChange={(e) => setTech(e.target.value)} placeholder="e.g. React, Python, Flask" /></div>
              <div className="field"><label>Abstract</label><textarea required rows="3" value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Comprehensive summary of project objectives, scope, and technical deliverables"></textarea></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Problem Statement (Optional)</label>
                  <textarea rows="2" value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Target problem or industry challenge being addressed"></textarea>
                </div>
                <div className="field">
                  <label>Objectives (Optional)</label>
                  <textarea rows="2" value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Core technical goals and deliverables"></textarea>
                </div>
              </div>

              <div className="field">
                <label>Methodology & System Architecture (Optional)</label>
                <textarea rows="2" value={methodology} onChange={(e) => setMethodology(e.target.value)} placeholder="Hardware, algorithmic approach, database schema, or design flow"></textarea>
              </div>

              {/* LIVE AI ORIGINALITY PRE-CHECK ASSISTANT */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600, fontSize: '13.5px' }}>
                    <Icon name="chart" size={16} /> AI Originality Pre-Check & Idea Assistant
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: 'rgba(99, 102, 241, 0.5)', color: 'var(--accent)', fontSize: '12px' }}
                    onClick={handleCheckOriginality}
                    disabled={checkingOriginality}
                  >
                    {checkingOriginality ? 'Analyzing Vector Similarity...' : 'Pre-Check Originality'}
                  </button>
                </div>

                {originalityReport && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                        Originality Score: <b>{originalityReport.originalityScore}%</b>
                        <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>
                          ({originalityReport.similarityScore}% similarity)
                        </span>
                      </span>
                      <span className={`badge ${originalityReport.originalityScore >= 75 ? 'badge-green' : originalityReport.originalityScore >= 45 ? 'badge-amber' : 'badge-red'}`}>
                        {originalityReport.riskLevel}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: 'var(--gray-bg)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{
                        width: `${originalityReport.originalityScore}%`,
                        height: '100%',
                        background: originalityReport.originalityScore >= 75 ? '#10b981' : originalityReport.originalityScore >= 45 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>

                    {/* BLOCKED SUBMISSION WARNING */}
                    {(originalityReport.originalityScore < 20 || originalityReport.isDirectDuplicate) && (
                      <div style={{
                        fontSize: '12.5px',
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        lineHeight: 1.45
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                          <Icon name="alert" size={14} /> SUBMISSION BLOCKED
                        </div>
                        Originality score is critically low ({originalityReport.originalityScore}% original, minimum platform requirement is 20%). Submitting identical or near-duplicate proposals is prohibited. Please adopt the dynamic idea enhancement recommendations below to differentiate your project.
                      </div>
                    )}

                    {originalityReport.isResubmissionOfRejected && (
                      <div style={{ fontSize: '12px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="alert" size={14} />
                        <span><b>Resubmission Alert:</b> High similarity to a previously rejected project detected. Faculty review will inspect historical reasons and prior comments.</span>
                      </div>
                    )}

                    {originalityReport.matchedProjects && originalityReport.matchedProjects.length > 0 && (
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                        Closest match in repository: <b>{originalityReport.matchedProjects[0].title}</b> ({originalityReport.matchedProjects[0].similarityScore}% match)
                      </div>
                    )}

                    {/* SIMPLIFIED ON-POINT PATENTABILITY ASSESSMENT WITH GOOGLE PATENTS */}
                    {originalityReport.patentability && (
                      <div className="patentability-panel" style={{ marginTop: '12px', border: '1px solid var(--border)' }}>
                        <div className="patentability-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="shield" size={15} />
                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                              Patentability &amp; Prior Art Check
                            </span>
                          </div>
                          <span className={`badge ${originalityReport.patentability.isPatentable ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '11px' }}>
                            {originalityReport.patentability.status}
                          </span>
                        </div>

                        {/* Punchy Simplified Verdict */}
                        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.45 }}>
                          <b>Verdict:</b> {originalityReport.patentability.verdict || originalityReport.patentability.primaryReason || originalityReport.patentability.status}
                        </div>

                        {/* Google Patents & External Prior Art Box */}
                        {originalityReport.patentability.externalPriorArt && (
                          <div className={`external-prior-art-box ${originalityReport.patentability.externalPriorArt.hasConflict ? 'has-conflict' : 'clean-clearance'}`}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: originalityReport.patentability.externalPriorArt.hasConflict ? '#f59e0b' : '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Icon name={originalityReport.patentability.externalPriorArt.hasConflict ? 'alert' : 'check'} size={14} />
                                {originalityReport.patentability.externalPriorArt.hasConflict
                                  ? 'Conflicting Prior Art Found on Google Patents'
                                  : 'Global Prior Art Clearance Confirmed'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                {originalityReport.patentability.externalPriorArt.similarityScore}% Overlap
                              </span>
                            </div>

                            {originalityReport.patentability.externalPriorArt.hasConflict ? (
                              <div style={{ marginTop: '4px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                                  {originalityReport.patentability.externalPriorArt.conflictingTitle}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                  ID: <b>{originalityReport.patentability.externalPriorArt.conflictingId}</b> &middot; Assignee: {originalityReport.patentability.externalPriorArt.assignee}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', marginTop: '4px', lineHeight: 1.4 }}>
                                  {originalityReport.patentability.externalPriorArt.summary}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                                {originalityReport.patentability.externalPriorArt.summary}
                              </div>
                            )}

                            <a
                              href={originalityReport.patentability.externalPriorArt.googlePatentsUrl || `https://patents.google.com/?q=${encodeURIComponent(title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="external-patent-link"
                            >
                              <Icon name="externalLink" size={13} />
                              {originalityReport.patentability.externalPriorArt.hasConflict
                                ? 'View Conflicting Invention on Google Patents'
                                : 'Verify Search on Google Patents'}
                            </a>
                          </div>
                        )}

                        {/* 1 or 2 concise engineering recommendations if not patentable */}
                        {!originalityReport.patentability.isPatentable && originalityReport.patentability.recommendations?.length > 0 && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Icon name="lightbulb" size={13} /> Key Requirements to Achieve Patent Eligibility:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.45 }}>
                              {originalityReport.patentability.recommendations.slice(0, 2).map((rec, rIdx) => (
                                <li key={rIdx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DYNAMIC IDEA ENHANCEMENT SUGGESTIONS - SHOWN ONLY IF ORIGINALITY < 60% OR DUPLICATE */}
                    {((originalityReport.originalityScore < 60 || originalityReport.isDirectDuplicate) &&
                      (originalityReport.enhancementSuggestions?.recommendations || []).filter(sug => !appliedEnhancementIds.includes(sug.id)).length > 0) && (
                      <div className="novelty-enhancement-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                          <Icon name="sparkle" size={14} /> AI Idea Enhancement Suggestions
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '8px' }}>
                          Elevate your project's originality above the 20% required threshold by incorporating these technical additions:
                        </div>

                        {(originalityReport.enhancementSuggestions.recommendations)
                          .filter(sug => !appliedEnhancementIds.includes(sug.id))
                          .map((sug) => (
                            <div key={sug.id} className="novelty-suggestion-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text)' }}>{sug.title}</span>
                                <span className="badge badge-amber" style={{ fontSize: '10px' }}>{sug.type}</span>
                              </div>
                              <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.45 }}>{sug.description}</p>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--accent)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                                onClick={() => handleApplyEnhancementSuggestion(sug)}
                              >
                                <Icon name="sparkle" size={11} /> Apply Enhancement
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="field">
                <label>GitHub repository</label>
                <input value={github} onChange={(e) => { setGithub(e.target.value); if (urlErrors.github) setUrlErrors(prev => ({ ...prev, github: '' })); }} placeholder="https://github.com/..." />
                {urlErrors.github && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.github}</div>}
              </div>

              <div className="field">
                <label>Documentation link</label>
                <input value={doc} onChange={(e) => { setDoc(e.target.value); if (urlErrors.doc) setUrlErrors(prev => ({ ...prev, doc: '' })); }} placeholder="Link to report / docs" />
                {urlErrors.doc && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.doc}</div>}
              </div>

              {submitType === 'Internal' ? (
                <div className="field">
                  <label>PPT link</label>
                  <input value={ppt} onChange={(e) => { setPpt(e.target.value); if (urlErrors.ppt) setUrlErrors(prev => ({ ...prev, ppt: '' })); }} placeholder="Link to presentation" />
                  {urlErrors.ppt && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.ppt}</div>}
                </div>
              ) : (
                <div className="field">
                  <label>Certificate (optional)</label>
                  <input value={cert} onChange={(e) => { setCert(e.target.value); if (urlErrors.cert) setUrlErrors(prev => ({ ...prev, cert: '' })); }} placeholder="Link to certificate" />
                  {urlErrors.cert && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.cert}</div>}
                </div>
              )}

              <div className="field">
                <label>Demo video (optional)</label>
                <input value={demo} onChange={(e) => { setDemo(e.target.value); if (urlErrors.demo) setUrlErrors(prev => ({ ...prev, demo: '' })); }} placeholder="YouTube / Drive link" />
                {urlErrors.demo && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.demo}</div>}
              </div>

              <div className="field">
                <label>Vercel link (optional)</label>
                <input value={vercel} onChange={(e) => { setVercel(e.target.value); if (urlErrors.vercel) setUrlErrors(prev => ({ ...prev, vercel: '' })); }} placeholder="https://your-app.vercel.app" />
                {urlErrors.vercel && <div style={{ color: '#f43f5e', fontSize: '11.5px', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="alert" size={12} /> {urlErrors.vercel}</div>}
              </div>

              <div className="field">
                <label>Upload Documents / Code (Multer file storage)</label>
                <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} style={{ padding: '6px' }} />
              </div>

              <div className="field" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '12px', borderRadius: '8px', marginTop: '14px' }}>
                <div style={{ color: '#818cf8', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="shield" size={15} /> Automated Faculty Reviewer Assignment
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  Faculty reviewers are automatically assigned based on domain expertise and pending workload capacity limits. Assigned faculty details remain confidential.
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                {/* SUBMISSION BUTTON - STRICTLY DISABLED IF ORIGINALITY < 20% */}
                {(() => {
                  const isBlocked = Boolean(originalityReport && (originalityReport.originalityScore < 20 || originalityReport.isDirectDuplicate));
                  return (
                    <button
                      type="submit"
                      disabled={isBlocked}
                      className="btn btn-primary"
                      style={isBlocked ? {
                        background: '#ef4444',
                        borderColor: '#dc2626',
                        cursor: 'not-allowed',
                        opacity: 0.8
                      } : {}}
                      title={isBlocked ? 'Submission blocked: Originality score too low (< 20%)' : undefined}
                    >
                      {isBlocked
                        ? 'Submission Blocked (Originality < 20%)'
                        : (submitType === 'Internal' ? 'Submit for review' : 'Send guide request')}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORT PROJECT */}
      {modal === 'report' && selectedProject && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Icon name="bell" size={18} /> Report Project Violation
              </h3>
              <RandomFillButton onFill={handleAutoFillReport} label="Test Fill" />
            </div>
            <p className="hint">Submit details to platform administrators regarding "{selectedProject.title}".</p>
            <form onSubmit={handleSubmitReport}>
              <div className="field">
                <label>Report Violation Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  style={{ background: '#0f172a', color: '#fff' }}
                >
                  <option style={{ background: '#0f172a', color: '#fff' }}>Plagiarism / Copyright Violation</option>
                  <option style={{ background: '#0f172a', color: '#fff' }}>Inappropriate Content</option>
                  <option style={{ background: '#0f172a', color: '#fff' }}>Misleading or Broken Links</option>
                  <option style={{ background: '#0f172a', color: '#fff' }}>Unauthorized Code Reuse</option>
                  <option style={{ background: '#0f172a', color: '#fff' }}>Other Guideline Violation</option>
                </select>
              </div>
              <div className="field">
                <label>Detailed Explanation / Proof</label>
                <textarea
                  required
                  rows="3"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this project violates guidelines..."
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger-outline" style={{ background: 'rgba(244,63,94,0.1)' }}>Submit Report to Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLONE / FORK */}
      {modal === 'clone' && selectedProject && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '520px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="notif-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                  <Icon name="folder" size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Clone & Fork Repository</h3>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="x" size={18} /></button>
            </div>

            <p className="hint" style={{ marginBottom: '16px' }}>
              Clone or fork <b>"{selectedProject.title}"</b> to start an extension, bug fix, or personal build.
            </p>

            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Git CLI Command:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#090d16', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <code style={{ fontSize: '13px', color: '#38bdf8', flex: 1, fontFamily: 'monospace', overflowX: 'auto' }}>
                  git clone {selectedProject.github || `https://github.com/campus/${(selectedProject.title || 'repo').toLowerCase().replace(/\s+/g, '-')}`}
                </code>
                <button className="btn btn-primary btn-sm" onClick={() => handleCopyCloneCmd(selectedProject)}>
                  Copy CLI
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#fff' }}>Fork & Build Enhancement</h4>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.45 }}>
                Initialize a new student project submission draft pre-filled with this repository's tech stack and category.
              </p>
              <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleForkProjectDraft(selectedProject)}>
                <Icon name="plus" size={14} /> Fork as New Student Build Draft
              </button>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOCKED */}
      {modal === 'locked' && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ textAlign: 'center', padding: '34px 26px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Icon name="lock" size={24} />
            </div>
            <h3 style={{ marginBottom: '8px' }}>Repository Locked</h3>
            <p className="hint" style={{ marginBottom: '20px', lineHeight: 1.55 }}>
              Access to <b>{lockedInfo.type} Projects</b> requires a student to have:
              <br />1. At least <b>3 approved projects</b> (You have: <b>{currentUser?.approved_projects || 0}</b> {(currentUser?.approved_projects || 0) >= 3 ? <span style={{ color: '#10b981', fontWeight: 600 }}>[Passed]</span> : <span style={{ color: '#ef4444', fontWeight: 600 }}>[Pending]</span>})
              <br />2. At least <b>{lockedInfo.req} credit points</b> (You have: <b>{currentUser?.credits || 0}</b> {(currentUser?.credits || 0) >= lockedInfo.req ? <span style={{ color: '#10b981', fontWeight: 600 }}>[Passed]</span> : <span style={{ color: '#ef4444', fontWeight: 600 }}>[Pending]</span>})
            </p>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '12.5px', color: 'var(--muted)', marginBottom: '20px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Icon name="lightbulb" size={15} style={{ color: '#fbbf24', marginTop: '2px' }} />
              <div>
                <b>How to unlock:</b> Submit projects for faculty review, publish project ideas, receive likes, or collaborate on enhancements.
              </div>
            </div>
            <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setModal(null)}>
              Understood
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL */}
      {modal === 'detail' && selectedProject && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div className="proj-badges" style={{ marginBottom: '6px' }}>
                  <BadgeType type={selectedProject.type} />
                  <BadgeStatus status={selectedProject.status} />
                </div>
                <h3 style={{ margin: 0, fontSize: '20px', lineHeight: 1.25 }}>{selectedProject.title}</h3>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                  by <span
                    className="clickable-name"
                    onClick={() => {
                      setModal(null);
                      navigate(`/profile?name=${encodeURIComponent(selectedProject.author)}`);
                    }}
                  >{selectedProject.author}</span> &middot; {selectedProject.dept}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {currentUser?.role === 'Student'
                    ? 'Faculty Review: Assigned [Blind Evaluation]'
                    : (selectedProject.assignedFaculty ? `Faculty Assigned: ${selectedProject.assignedFaculty}` : 'Faculty: Unassigned')}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="x" size={20} /></button>
            </div>

            <div style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '18px' }}>
              <b>Abstract / Description:</b><br />
              {selectedProject.abstract || selectedProject.description || 'No description provided.'}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <b>Technologies Used:</b>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {(selectedProject.tech || []).map((t, idx) => (
                  <span key={idx} className="badge badge-gray">{t}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <b>Verified Repository & Links:</b>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '13px' }}>
                {selectedProject.github && <a href={selectedProject.github} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="folder" size={14} /> GitHub Code</a>}
                {selectedProject.doc && <a href={selectedProject.doc} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="book" size={14} /> Documentation</a>}
                {selectedProject.ppt && <a href={selectedProject.ppt} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="award" size={14} /> Presentation (PPT)</a>}
                {selectedProject.cert && <a href={selectedProject.cert} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="award" size={14} /> Certificate</a>}
                {selectedProject.demo && <a href={selectedProject.demo} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="eye" size={14} /> Demo Video</a>}
                {selectedProject.vercel && <a href={selectedProject.vercel} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="trend" size={14} /> Vercel Link</a>}
              </div>
            </div>

            {selectedProject.files && selectedProject.files.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <b>Uploaded Artifacts & Files:</b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '12.5px' }}>
                  {selectedProject.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
                      <Icon name="folder" size={13} /> {f.fileName} ({f.fileType})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px', fontSize: '14px', color: '#cbd5e1' }}>
              <b>Collaborators:</b> {selectedProject.collaborators && selectedProject.collaborators.length ? selectedProject.collaborators.join(', ') : 'None'}
            </div>

            {selectedProject.enhancements && selectedProject.enhancements.length > 0 && (
              <div style={{ marginBottom: '18px', background: 'rgba(16,185,129,0.06)', color: '#34d399', borderRadius: '10px', padding: '12px', fontSize: '13.5px', border: '1px solid rgba(16,185,129,0.15)' }}>
                <b>Approved Enhancements:</b>
                {selectedProject.enhancements.map((e, idx) => (
                  <div key={idx} style={{ marginTop: '4px', borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: '4px' }}>
                    <b>{e.title}</b> by {e.author}: {e.details}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '18px', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={(e) => handleOpenCloneModal(e, selectedProject)}><Icon name="folder" size={14} /> Clone / Fork Project</button>
                <button className="btn btn-outline btn-sm" onClick={handleOpenReportModal}><Icon name="bell" size={14} /> Report Project</button>
                {currentUser?.role === 'Student' && currentUser?.name !== selectedProject.author && !(selectedProject.collaborators || []).includes(currentUser?.name) && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleRequestCollab(selectedProject.id)}><Icon name="plus" size={14} /> Request Collaboration</button>
                )}
                {currentUser?.role === 'Student' && (selectedProject.collaborators || []).includes(currentUser?.name) && (
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('enhancement')}><Icon name="plus" size={14} /> Submit Enhancement</button>
                )}
                {currentUser?.role === 'Administrator' && (
                  <button className="btn btn-danger-outline btn-sm" onClick={(e) => handleDeleteProject(e, selectedProject.id)}>Delete Project (Admin)</button>
                )}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Close</button>
            </div>

            <div className="comment-section">
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <span>Comments ({selectedProject.comments ? selectedProject.comments.length : 0})</span>
              </div>
              <div className="comment-list">
                {selectedProject.comments && selectedProject.comments.length ? (
                  selectedProject.comments.map((c, idx) => (
                    <div key={idx} className="comment-bubble">
                      <div className="comment-author">{c.author}<span className="comment-time">{c.time}</span></div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0 }}>No comments yet.</p>
                )}
              </div>
              {currentUser && (
                <form className="comment-form" onSubmit={handlePostComment}>
                  <textarea
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                  ></textarea>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px', height: '40px' }}>Post</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENHANCEMENT */}
      {modal === 'enhancement' && selectedProject && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Submit Project Enhancement</h3>
              <RandomFillButton onFill={handleAutoFillEnhancement} label="Test Fill" />
            </div>
            <p className="hint">Propose code improvements on "{selectedProject.title}" for guide review.</p>
            <form onSubmit={handleSubmitEnhancement}>
              <div className="field"><label>Enhancement Title</label><input required value={enhTitle} onChange={(e) => setEnhTitle(e.target.value)} placeholder="e.g. Added face spoofing detection" /></div>
              <div className="field"><label>Details of Enhancement</label><textarea required value={enhDetails} onChange={(e) => setEnhDetails(e.target.value)} rows="3" placeholder="Explain your code improvements..."></textarea></div>
              <div className="field"><label>Pull Request / Code Link</label><input required value={enhLink} onChange={(e) => setEnhLink(e.target.value)} placeholder="https://github.com/.../pull/..." /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Faculty Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
