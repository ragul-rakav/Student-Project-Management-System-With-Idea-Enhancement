import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';
import { BadgeType } from '../components/common/Badge';
import { EmptyState } from '../components/common/Toast';
import RandomFillButton from '../components/common/RandomFillButton';
import { getRandomReviewDecision } from '../utils/mockDataGenerator';

export default function ReviewsPage() {
  const { showToast } = useApp();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'submissions';

  const [tab, setTab] = useState(initialTab);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [inspectItem, setInspectItem] = useState(null);
  const [inspectReport, setInspectReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [reportRemark, setReportRemark] = useState('');

  // Structured Rejection Modal
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionCategory, setRejectionCategory] = useState('Plagiarism / Direct Duplicate');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [rejectionComments, setRejectionComments] = useState('');

  // Historical Audit Modal
  const [historyModalItem, setHistoryModalItem] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (queryParams.get('tab')) {
      setTab(queryParams.get('tab'));
    }
  }, [location.search]);

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews');
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionAction = async (id, decision, customReason = '') => {
    try {
      const payload = {
        id,
        decision,
        rejectionReason: customReason || rejectionCategory,
        feedback: decision === 'Rejected' ? (rejectionComments || feedback) : feedback
      };

      const res = await api.post('/reviews/action', payload);
      if (res.data.success) {
        showToast(res.data.message);
        setInspectItem(null);
        setRejectModalItem(null);
        setFeedback('');
        setCustomRejectionReason('');
        setRejectionComments('');
        fetchReviewsData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Review action failed');
    }
  };

  const handleAutoFillFeedback = () => {
    const mock = getRandomReviewDecision();
    setFeedback(mock.comments);
    showToast('Auto-filled faculty evaluation feedback!');
  };

  const handleAutoFillRejection = () => {
    const mock = getRandomReviewDecision();
    setRejectionCategory('Lack of Original Novelty / Insufficient Scope');
    setCustomRejectionReason(mock.rejectionReason);
    setRejectionComments(mock.comments);
    showToast('Auto-filled rejection justification & guidance!');
  };

  const handleVerifyFixesAndApprove = (item) => {
    const verifiedFeedback = `Prior rejection reason ("${item.resubmissionDetails?.originalRejectionReason || 'previous defect'}") verified and resolved. The updated methodology and technical additions demonstrate genuine student innovation. Approved.`;
    handleDecisionAction(item.id, 'Approved', '', verifiedFeedback);
  };

  const handleRequestMoreIdeas = (item) => {
    const changeFeedback = `The resubmission still closely resembles the previously rejected work ("${item.resubmissionDetails?.priorProjectTitle || 'prior project'}"). Further novel formulations, hardware coupling, or architectural differentiators are required before this project can be approved.`;
    setFeedback(changeFeedback);
    showToast('Pre-filled change request guidance for student. Review and confirm below.');
  };

  const handleResolveReport = async (reportId, action) => {
    if (!reportRemark.trim()) {
      showToast('Written remark/reason is required before making a decision on this report.');
      return;
    }

    try {
      const res = await api.post('/admin/reports/resolve', { reportId, action, remark: reportRemark });
      if (res.data.success) {
        showToast(res.data.message);
        setInspectReport(null);
        setReportRemark('');
        fetchReviewsData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Report resolution failed');
    }
  };

  const openHistoryModal = async (submissionId, title) => {
    setHistoryModalItem({ id: submissionId, title });
    setLoadingHistory(true);
    setHistoryRecords([]);
    try {
      const res = await api.get(`/reviews/history/${submissionId}`);
      if (res.data.success) {
        setHistoryRecords(res.data.history || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load historical review data');
    } finally {
      setLoadingHistory(false);
    }
  };

  const pendingReportsCount = reports.filter(r => r.status === 'Pending').length;

  return (
    <div>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-accent" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ProjectPulse Originality Engine
            </span>
          </div>
          <h1>Faculty Evaluation & AI Review Queue</h1>
          <p>Inspect project originality scores, examine rejected resubmission flags, and record immutable academic decisions.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sub-tabs" style={{ marginBottom: '20px' }}>
          <div className={`sub-tab ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>
            Project Submissions ({reviews.length})
          </div>
          <div className={`sub-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="shield" size={14} /> Content Violation Reports {pendingReportsCount > 0 && `(${pendingReportsCount})`}
          </div>
        </div>

        {/* TAB: PROJECT SUBMISSIONS */}
        {tab === 'submissions' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--muted)', padding: '30px' }}>Analyzing originality and loading review queue...</div>
            ) : reviews.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Submission Title</th>
                      <th>Student Author</th>
                      <th>Type</th>
                      <th>AI Originality</th>
                      <th>Domain Category</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => {
                      const origScore = r.originalityScore !== undefined ? r.originalityScore : 100;
                      const isHighRisk = origScore < 45 || r.riskLevel?.includes('Duplicate') || r.riskLevel?.includes('High');
                      const isModRisk = origScore >= 45 && origScore < 75;

                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{r.isEnhancement ? `Enhancement: ${r.enhancementTitle}` : r.title}</span>
                              {r.isResubmissionOfRejected && (
                                <span className="badge badge-red" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Flagged: Matches previously rejected project">
                                  <Icon name="alert" size={12} /> Resubmission Alert
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>{r.author}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.dept || 'Computer Science'}</div>
                          </td>
                          <td><BadgeType type={r.type} /></td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span
                                className={`badge ${origScore >= 75 ? 'badge-green' : isModRisk ? 'badge-yellow' : 'badge-red'}`}
                                style={{ width: 'fit-content', fontWeight: 600 }}
                              >
                                {origScore}% Original
                              </span>
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                {r.riskLevel || 'Low'} Risk
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--muted)' }}>{r.category}</td>
                          <td style={{ color: 'var(--muted)' }}>{r.submitted}</td>
                          <td style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setInspectItem(r)}>
                              <Icon name="eye" size={14} /> Evaluate & Originality
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { setInspectItem(r); }}
                            >
                              <Icon name="check" size={14} /> Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState msg="All caught up — no pending project reviews assigned to you." ic="check" />
            )}
          </div>
        )}

        {/* TAB: CONTENT VIOLATION REPORTS */}
        {tab === 'reports' && (
          <div>
            {loading ? (
              <div style={{ color: 'var(--muted)', padding: '30px' }}>Loading assigned reports...</div>
            ) : reports.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Project Title</th>
                    <th>Reporter</th>
                    <th>Violation Category</th>
                    <th>Reason / Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{rep.projectTitle}</td>
                      <td>{rep.reporter}</td>
                      <td><span className="badge badge-gray">{rep.category}</span></td>
                      <td style={{ color: '#cbd5e1', maxWidth: '280px', fontSize: '12.5px' }}>{rep.reason}</td>
                      <td>
                        <span className={`badge ${rep.status === 'Pending' ? 'badge-yellow' : 'badge-gray'}`}>
                          {rep.status}
                        </span>
                      </td>
                      <td>
                        {rep.status === 'Pending' ? (
                          <button className="btn btn-outline btn-sm" onClick={() => setInspectReport(rep)}>
                            <Icon name="bell" size={14} /> Investigate Report
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState msg="No content violation reports assigned to your domain." ic="check" />
            )}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL: FULL EVALUATION & ORIGINALITY BREAKDOWN */}
      {inspectItem && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setInspectItem(null)}>
          <div className="modal" style={{ width: '740px', maxWidth: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <BadgeType type={inspectItem.type} />
                  <span className={`badge ${inspectItem.originalityScore >= 75 ? 'badge-green' : inspectItem.originalityScore >= 45 ? 'badge-yellow' : 'badge-red'}`}>
                    AI Originality: {inspectItem.originalityScore !== undefined ? inspectItem.originalityScore : 100}%
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '20px' }}>
                  {inspectItem.isEnhancement ? `Enhancement: ${inspectItem.enhancementTitle}` : inspectItem.title}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                  Submitted by <b>{inspectItem.author}</b> &middot; Domain: {inspectItem.category} &middot; {inspectItem.submitted}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setInspectItem(null)}><Icon name="x" size={20} /></button>
            </div>

            {/* PRIOR SUBMISSION HISTORY & REJECTION AUDIT PANEL (FOR SIMILAR OR UPDATED/RESUBMITTED WORK) */}
            {inspectItem.isResubmissionOfRejected && inspectItem.resubmissionDetails && (
              <div className="prior-audit-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '15px' }}>
                    <Icon name="book" size={17} />
                    <span>Prior Submission History &amp; Rejection Audit</span>
                  </div>
                  <span className="badge badge-red" style={{ fontSize: '11px' }}>
                    {inspectItem.resubmissionDetails.similarityScore}% Prior Art Overlap
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#fca5a5', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  The student previously submitted a project that was rejected. Below are the complete historical records, the original rejection reason and faculty comments, and an audit of what has been fixed or whether new ideas are still needed.
                </p>

                {/* 1. What the Student Submitted Last Time */}
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Previous Submission Record (What was submitted last time):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Prior Title:</span><br />
                      <b style={{ color: '#fff' }}>{inspectItem.resubmissionDetails.priorProjectTitle}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Prior Tech Stack:</span><br />
                      <span style={{ color: '#cbd5e1' }}>
                        {Array.isArray(inspectItem.resubmissionDetails.priorTech) ? inspectItem.resubmissionDetails.priorTech.join(', ') : (inspectItem.resubmissionDetails.priorTech || 'Archived Stack')}
                      </span>
                    </div>
                  </div>

                  {inspectItem.resubmissionDetails.priorAbstract && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '8px' }}>
                      <b style={{ color: 'var(--text-dim)' }}>Prior Abstract:</b> {inspectItem.resubmissionDetails.priorAbstract}
                    </div>
                  )}

                  {inspectItem.resubmissionDetails.priorProblemStatement && (
                    <div style={{ fontSize: '11.5px', color: 'var(--muted-2)' }}>
                      <b>Prior Problem Statement:</b> {inspectItem.resubmissionDetails.priorProblemStatement}
                    </div>
                  )}
                </div>

                {/* 2. Why It Got Rejected */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Rejection Audit (Why it got rejected):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Original Rejecting Faculty:</span><br />
                      <b style={{ color: '#fbbf24' }}>{inspectItem.resubmissionDetails.originalRejectingFaculty}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Rejection Date:</span><br />
                      <span style={{ color: '#e2e8f0' }}>
                        {inspectItem.resubmissionDetails.originalRejectionDate ? new Date(inspectItem.resubmissionDetails.originalRejectionDate).toLocaleDateString() : 'Historical Archive'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--muted)' }}>Recorded Rejection Reason:</span><br />
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{inspectItem.resubmissionDetails.originalRejectionReason}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Previous Faculty Reviewer Remarks:</span>
                    <div style={{ fontStyle: 'italic', color: '#e2e8f0', marginTop: '2px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
                      "{inspectItem.resubmissionDetails.originalFacultyComments}"
                    </div>
                  </div>
                </div>

                {/* 3. Delta Analysis & What Has Changed */}
                {inspectItem.resubmissionDetails.auditComparison && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '12px 14px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      3. Resubmission Delta Check (What has been updated):
                    </div>
                    <div style={{ color: '#e2e8f0', lineHeight: 1.5, marginBottom: '6px' }}>
                      <b>Technical Differentiators Detected:</b> {inspectItem.resubmissionDetails.auditComparison.whatIsNewInThisSubmission}
                    </div>

                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Faculty Evaluation Checklist:</span>
                      <div className="audit-checklist">
                        {inspectItem.resubmissionDetails.auditComparison.facultyChecklist.map((checkText, cIdx) => (
                          <div key={cIdx} className="audit-checklist-item">
                            <Icon name="check" size={13} style={{ color: '#10b981' }} />
                            <span style={{ color: '#cbd5e1' }}>{checkText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Evaluation Shortcuts for Faculty */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ background: '#059669', borderColor: '#10b981', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => handleVerifyFixesAndApprove(inspectItem)}
                  >
                    <Icon name="check" size={13} /> Fixes Verified &amp; Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => handleRequestMoreIdeas(inspectItem)}
                  >
                    <Icon name="refresh" size={13} /> Request Further Ideas &amp; Revisions
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11.5px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                    onClick={() => openHistoryModal(inspectItem.resubmissionDetails.priorSubmissionId, inspectItem.resubmissionDetails.priorProjectTitle)}
                  >
                    <Icon name="book" size={13} /> View Full Prior Audit Trail
                  </button>
                </div>
              </div>
            )}

            {/* AI SIMILARITY ANALYSIS & MATCHED PROJECTS PANEL */}
            <div style={{
              background: 'var(--card-solid)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="chart" size={16} />
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                    Vector Similarity &amp; Repository Comparison
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Originality Score: <b style={{ color: 'var(--text)' }}>{inspectItem.originalityScore !== undefined ? inspectItem.originalityScore : 100}%</b>
                  </span>
                </div>
              </div>

              {/* Progress bar gauge (Solid subtle colors, no flashy gradients) */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{
                  width: `${inspectItem.originalityScore !== undefined ? inspectItem.originalityScore : 100}%`,
                  height: '100%',
                  background: (inspectItem.originalityScore >= 75)
                    ? '#10b981'
                    : (inspectItem.originalityScore >= 45)
                    ? '#f59e0b'
                    : '#ef4444',
                  borderRadius: '4px'
                }}></div>
              </div>

              {/* Matched Projects List */}
              {inspectItem.matchedProjects && inspectItem.matchedProjects.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>
                    TOP MATCHED REPOSITORY WORK:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inspectItem.matchedProjects.slice(0, 3).map((match, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '12.5px'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{match.title}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '11.5px', marginTop: '2px' }}>
                            Author: {match.studentName} ({match.studentDept}) &middot; Status: <span style={{ color: match.status === 'Rejected' ? '#f87171' : '#38bdf8' }}>{match.status}</span> &middot; Date: {match.submissionDate}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${match.similarityScore > 50 ? 'badge-red' : match.similarityScore > 25 ? 'badge-yellow' : 'badge-gray'}`}>
                            {match.similarityScore}% Similar
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="check" size={14} style={{ color: '#10b981' }} />
                    No significant duplicate matches detected across university repository archives.
                  </div>
                </div>
              )}
            </div>

            {/* SIMPLIFIED ON-POINT PATENTABILITY ASSESSMENT */}
            {inspectItem.patentability && (
              <div className="patentability-panel" style={{ marginBottom: '18px' }}>
                <div className="patentability-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="shield" size={16} />
                    <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                      Patentability &amp; Prior Art Clearance
                    </span>
                  </div>
                  <span className={`badge ${inspectItem.patentability.isPatentable ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '11.5px' }}>
                    {inspectItem.patentability.status}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.45 }}>
                  <b>Verdict:</b> {inspectItem.patentability.verdict || inspectItem.patentability.justification}
                </div>

                {/* Google Patents Conflict or Clearance */}
                {inspectItem.patentability.externalPriorArt && (
                  <div className={`external-prior-art-box ${inspectItem.patentability.externalPriorArt.hasConflict ? 'has-conflict' : 'clean-clearance'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: inspectItem.patentability.externalPriorArt.hasConflict ? '#f59e0b' : '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Icon name={inspectItem.patentability.externalPriorArt.hasConflict ? 'alert' : 'check'} size={14} />
                        {inspectItem.patentability.externalPriorArt.hasConflict
                          ? 'Conflicting Invention on Google Patents'
                          : 'Clearance: No Direct Prior Art Conflicts on Google Patents'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {inspectItem.patentability.externalPriorArt.similarityScore}% Overlap
                      </span>
                    </div>

                    {inspectItem.patentability.externalPriorArt.hasConflict ? (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                          {inspectItem.patentability.externalPriorArt.conflictingTitle}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          Patent / ID: <b>{inspectItem.patentability.externalPriorArt.conflictingId}</b> &middot; Assignee: {inspectItem.patentability.externalPriorArt.assignee}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted-2)', marginTop: '4px', lineHeight: 1.4 }}>
                          {inspectItem.patentability.externalPriorArt.summary}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                        {inspectItem.patentability.externalPriorArt.summary}
                      </div>
                    )}

                    <a
                      href={inspectItem.patentability.externalPriorArt.googlePatentsUrl || `https://patents.google.com/?q=${encodeURIComponent(inspectItem.title || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-patent-link"
                    >
                      <Icon name="externalLink" size={13} />
                      {inspectItem.patentability.externalPriorArt.hasConflict ? 'View Invention on Google Patents' : 'Verify on Google Patents'}
                    </a>
                  </div>
                )}

                {!inspectItem.patentability.isPatentable && inspectItem.patentability.recommendations?.length > 0 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '10px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="lightbulb" size={13} /> Faculty Guidance for Student to Attain Patent Eligibility:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.45 }}>
                      {inspectItem.patentability.recommendations.slice(0, 2).map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Project Details Content */}
            <div style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '18px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <b style={{ color: '#fff' }}>Project Abstract & Specification:</b><br />
              {inspectItem.abstract || inspectItem.details || inspectItem.description || 'Full project specification submitted for faculty evaluation.'}
            </div>

            {inspectItem.tech && inspectItem.tech.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <b>Technologies Used:</b>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {inspectItem.tech.map((t, idx) => (
                    <span key={idx} className="badge badge-gray">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <b>Verified Repository & Link Materials:</b>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '13px' }}>
                {inspectItem.github && <a href={inspectItem.github} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="folder" size={14} /> Source Code (GitHub)</a>}
                {inspectItem.doc && <a href={inspectItem.doc} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="book" size={14} /> Report & Documentation</a>}
                {inspectItem.ppt && <a href={inspectItem.ppt} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="award" size={14} /> Presentation (PPT)</a>}
                {inspectItem.codeLink && <a href={inspectItem.codeLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="folder" size={14} /> Pull Request Link</a>}
              </div>
            </div>

            {/* Faculty Feedback Box */}
            <div className="field" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>Faculty Feedback / Change Requests Notes:</label>
                <RandomFillButton onFill={handleAutoFillFeedback} label="Test Feedback" />
              </div>
              <textarea
                rows="2"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback, notes, or specific requirements for the student..."
              ></textarea>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setInspectItem(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => openHistoryModal(inspectItem.id, inspectItem.title)}
                  title="View full audit decision trail"
                >
                  <Icon name="book" size={14} /> Audit Trail
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {/* REJECT BUTTON */}
                <button
                  className="btn btn-danger-outline"
                  onClick={() => setRejectModalItem(inspectItem)}
                  title="Permanently reject with immutable recorded reason"
                >
                  <Icon name="x" size={14} /> Reject Submission
                </button>

                {/* REQUEST CHANGES BUTTON */}
                <button
                  className="btn btn-outline"
                  style={{ borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}
                  onClick={() => handleDecisionAction(inspectItem.id, 'Changes Requested')}
                  title="Send back for student revision"
                >
                  Request Changes
                </button>

                {/* APPROVE BUTTON */}
                <button
                  className="btn btn-primary"
                  onClick={() => handleDecisionAction(inspectItem.id, 'Approved')}
                  title="Approve and award credits"
                >
                  <Icon name="check" size={14} /> Approve Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED REJECTION MODAL (MANDATORY RECORDED REASON) */}
      {rejectModalItem && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setRejectModalItem(null)}>
          <div className="modal" style={{ width: '560px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="notif-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                  <Icon name="x" size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f87171' }}>Record Official Rejection Decision</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RandomFillButton onFill={handleAutoFillRejection} label="Test Fill" />
                <button className="icon-btn" onClick={() => setRejectModalItem(null)}><Icon name="x" size={18} /></button>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Rejection decisions are <b>permanently archived in the immutable audit history</b>. If this project or a similar variation is resubmitted in the future, your identity and recorded reason will be presented to subsequent reviewing faculty.
            </p>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 600, color: '#fff' }}>Official Rejection Reason Category:</label>
              <select
                value={rejectionCategory}
                onChange={(e) => setRejectionCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
              >
                <option value="Plagiarism / Direct Duplicate">Plagiarism / Direct Duplicate</option>
                <option value="Resubmission of Previously Rejected Project">Resubmission of Previously Rejected Project</option>
                <option value="Lack of Original Novelty / Insufficient Scope">Lack of Original Novelty / Insufficient Scope</option>
                <option value="Feasibility / Incomplete Methodology">Feasibility / Incomplete Methodology</option>
                <option value="Academic Integrity & Ethics Conflict">Academic Integrity & Ethics Conflict</option>
                <option value="Other Academic Disqualification">Other Academic Disqualification</option>
              </select>
            </div>

            <div className="field" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: 600, color: '#f87171' }}>Specific Rejection Justification (Required):</label>
              <textarea
                required
                rows="2"
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                placeholder="State specific technical, architectural, or academic grounds for rejection..."
              ></textarea>
            </div>

            <div className="field" style={{ marginBottom: '18px' }}>
              <label style={{ fontWeight: 600, color: '#fff' }}>Detailed Guidance for Student (Optional):</label>
              <textarea
                rows="2"
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                placeholder="Constructive advice or recommendations for future work..."
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setRejectModalItem(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                onClick={() => {
                  if (!customRejectionReason.trim()) {
                    showToast('Please state a specific rejection justification.');
                    return;
                  }
                  handleDecisionAction(rejectModalItem.id, 'Rejected', `${rejectionCategory}: ${customRejectionReason}`);
                }}
              >
                Confirm Immutable Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORICAL REVIEW AUDIT LOG MODAL */}
      {historyModalItem && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setHistoryModalItem(null)}>
          <div className="modal" style={{ width: '600px', maxWidth: '95%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Historical Decision Audit Trail</h3>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                  Submission ID #{historyModalItem.id}: <b>{historyModalItem.title}</b>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setHistoryModalItem(null)}><Icon name="x" size={18} /></button>
            </div>

            {loadingHistory ? (
              <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading immutable decision history...</div>
            ) : historyRecords.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyRecords.map((dec) => (
                  <div key={dec.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className={`badge ${dec.decision === 'Approved' ? 'badge-green' : dec.decision === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>
                        {dec.decision}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                        {dec.created_at ? new Date(dec.created_at).toLocaleString() : 'Archive'}
                      </span>
                    </div>

                    <div style={{ color: '#fff', fontWeight: 600, marginTop: '4px' }}>
                      Reviewer: <span style={{ color: '#38bdf8' }}>{dec.reviewer_name}</span>
                    </div>

                    {dec.rejection_reason && (
                      <div style={{ color: '#f87171', marginTop: '4px' }}>
                        <b>Recorded Reason:</b> {dec.rejection_reason}
                      </div>
                    )}

                    {dec.faculty_comments && (
                      <div style={{ color: '#cbd5e1', marginTop: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                        <b>Comments:</b> "{dec.faculty_comments}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', padding: '20px', textAlign: 'center' }}>
                No prior historical review decisions recorded for this submission ID yet.
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '18px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setHistoryModalItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: CONTENT REPORT RESOLUTION */}
      {inspectReport && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setInspectReport(null)}>
          <div className="modal" style={{ width: '560px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="notif-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185' }}>
                  <Icon name="bell" size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Investigate Content Report</h3>
              </div>
              <button className="icon-btn" onClick={() => setInspectReport(null)}><Icon name="x" size={18} /></button>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '14.5px', marginBottom: '4px' }}>
                Project: {inspectReport.projectTitle}
              </div>
              <div style={{ color: 'var(--muted)', marginBottom: '8px' }}>
                Reported by <b>{inspectReport.reporter}</b> &middot; Violation Category: <span style={{ color: '#fb7185' }}>{inspectReport.category}</span>
              </div>
              <div style={{ color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                <b>Reporter Explanation:</b> "{inspectReport.reason}"
              </div>
            </div>

            <div className="field" style={{ marginBottom: '18px' }}>
              <label style={{ fontWeight: 600, color: '#fbbf24' }}>
                Faculty Investigation Remark (Required prior to decision):
              </label>
              <textarea
                required
                rows="3"
                value={reportRemark}
                onChange={(e) => setReportRemark(e.target.value)}
                placeholder="State your findings regarding this report..."
              ></textarea>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon name="alert" size={13} style={{ color: '#fbbf24' }} />
                <span><b>Note:</b> Dismissing an invalid/fake report automatically deducts a <b>-5 credit penalty</b> from reporter ({inspectReport.reporter}).</span>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setInspectReport(null)}>Cancel</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ borderColor: 'rgba(244,63,94,0.4)', color: '#fb7185' }} onClick={() => handleResolveReport(inspectReport.id, 'reject')}>
                  Dismiss (Fake Report - Apply -5 Penalty)
                </button>
                <button className="btn btn-danger-outline" onClick={() => handleResolveReport(inspectReport.id, 'deleteProject')}>
                  Approve Report & Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
