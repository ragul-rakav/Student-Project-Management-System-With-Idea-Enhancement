import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import Icon from '../components/common/Icons';

export default function AdminCenterPage() {
  const { showToast } = useApp();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'students';

  const [tab, setTab] = useState(initialTab);

  // Data State
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [domainRequests, setDomainRequests] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modals & Editors
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newDeptName, setNewDeptName] = useState('');

  // Tiers State
  const [tierIdea, setTierIdea] = useState(60);
  const [tierInternal, setTierInternal] = useState(100);
  const [tierExternal, setTierExternal] = useState(200);

  // Faculty Config Modal
  const [configFaculty, setConfigFaculty] = useState(null);
  const [facultyThreshold, setFacultyThreshold] = useState(10);
  const [facultySpecs, setFacultySpecs] = useState('');

  // Report Action State
  const [inspectReport, setInspectReport] = useState(null);
  const [reportRemark, setReportRemark] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (queryParams.get('tab')) {
      setTab(queryParams.get('tab'));
    }
  }, [location.search]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [uRes, dRes, tRes, repRes, domRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/departments'),
        api.get('/admin/tiers'),
        api.get('/admin/reports'),
        api.get('/admin/domains')
      ]);

      if (uRes.data.success) setUsers(uRes.data.users);
      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (tRes.data.success) {
        const tiers = tRes.data.accessTiers;
        if (tiers[1]) setTierIdea(tiers[1].min);
        if (tiers[2]) setTierInternal(tiers[2].min);
        if (tiers[3]) setTierExternal(tiers[3].min);
      }
      if (repRes.data.success) setReports(repRes.data.reports);
      if (domRes.data.success) setDomainRequests(domRes.data.domainRequests);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const studentsList = users.filter(u => u.role === 'Student');
  const facultyList = users.filter(u => u.role === 'Faculty');

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', { name: newUserName, email: newUserEmail, role: newUserRole });
      if (res.data.success) {
        showToast(res.data.message);
        setAddUserModal(false);
        setNewUserName(''); setNewUserEmail('');
        fetchAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleRemoveUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}'s account from the platform?`)) {
      try {
        const res = await api.delete(`/admin/users/${id}`);
        if (res.data.success) {
          showToast(res.data.message);
          fetchAdminData();
        }
      } catch (err) {
        showToast('Remove user failed');
      }
    }
  };

  const handleResolveDomain = async (requestId, action, approvedDomainName) => {
    try {
      const res = await api.post('/admin/domains/resolve', { requestId, action, approvedDomainName });
      if (res.data.success) {
        showToast(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      showToast('Domain resolution failed');
    }
  };

  const handleSaveFacultyConfig = async (e) => {
    e.preventDefault();
    if (!configFaculty) return;
    try {
      const specsArray = facultySpecs.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const res = await api.put('/admin/faculty/config', {
        facultyId: configFaculty.id,
        specializations: specsArray,
        maxPendingThreshold: parseInt(facultyThreshold)
      });
      if (res.data.success) {
        showToast(res.data.message);
        setConfigFaculty(null);
        fetchAdminData();
      }
    } catch (err) {
      showToast('Faculty configuration update failed');
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      const res = await api.post('/admin/departments', { name: newDeptName });
      if (res.data.success) {
        showToast(res.data.message);
        setNewDeptName('');
        setDepartments(res.data.departments);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleSaveTiers = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/tiers', { idea: tierIdea, internal: tierInternal, external: tierExternal });
      if (res.data.success) {
        showToast(res.data.message);
      }
    } catch (err) {
      showToast('Save tiers failed');
    }
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
        fetchAdminData();
      }
    } catch (err) {
      showToast('Resolve report failed');
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: '40px' }}>Loading Admin Center...</div>;
  }

  const pendingDomainCount = domainRequests.filter(r => r.status === 'Pending').length;
  const pendingReportCount = reports.filter(r => r.status === 'Pending').length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Platform Governance & Admin Center</h1>
          <p>Super-user administration for student/faculty directories, domain verification, and system settings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddUserModal(true)}>
          <Icon name="plus" size={16} /> Add User Account
        </button>
      </div>

      <div className="card" style={{ padding: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sub-tabs" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className={`sub-tab ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="graduation" size={14} /> Students Directory ({studentsList.length})
          </div>
          <div className={`sub-tab ${tab === 'faculty' ? 'active' : ''}`} onClick={() => setTab('faculty')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="faculty" size={14} /> Faculty Directory ({facultyList.length})
          </div>
          <div className={`sub-tab ${tab === 'domains' ? 'active' : ''}`} onClick={() => setTab('domains')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="zap" size={14} /> Custom Domain Requests {pendingDomainCount > 0 && `(${pendingDomainCount})`}
          </div>
          <div className={`sub-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="shield" size={14} /> Moderation Reports {pendingReportCount > 0 && `(${pendingReportCount})`}
          </div>
          <div className={`sub-tab ${tab === 'departments' ? 'active' : ''}`} onClick={() => setTab('departments')}>
            Departments
          </div>
          <div className={`sub-tab ${tab === 'tiers' ? 'active' : ''}`} onClick={() => setTab('tiers')}>
            Access Tiers
          </div>
        </div>

        {/* STUDENT MANAGEMENT TAB */}
        {tab === 'students' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>Student Directory & Accounts</h3>
            </div>
            <table>
              <thead>
                <tr><th>Student Name</th><th>Email</th><th>Department</th><th>Academic Year</th><th>Credits</th><th>Approved Projects</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {studentsList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                    <td>{u.dept}</td>
                    <td><span className="badge badge-gray">{u.academic_year}</span></td>
                    <td><span className="credit-pill"><Icon name="star" size={11} /> {u.credits}</span></td>
                    <td style={{ fontWeight: 600, color: '#34d399' }}>{u.approved_projects}</td>
                    <td>
                      <button className="btn btn-danger-outline btn-sm" onClick={() => handleRemoveUser(u.id, u.name)}>Remove Account</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FACULTY MANAGEMENT TAB */}
        {tab === 'faculty' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>Faculty Directory, Domains & Workload Controls</h3>
            </div>
            <table>
              <thead>
                <tr><th>Faculty Name</th><th>Email</th><th>Department</th><th>Domain Specializations</th><th>Workload Limit</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {facultyList.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{f.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{f.email}</td>
                    <td>{f.dept}</td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(f.specializations || [f.domain_of_interest]).map((s, idx) => (
                          <span key={idx} className="badge badge-gray" style={{ fontSize: '10.5px' }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{f.maxPendingThreshold || 10} pending max</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        setConfigFaculty(f);
                        setFacultyThreshold(f.maxPendingThreshold || 10);
                        setFacultySpecs((f.specializations || [f.domain_of_interest]).join(', '));
                      }}>
                        Edit Domains
                      </button>
                      <button className="btn btn-danger-outline btn-sm" onClick={() => handleRemoveUser(f.id, f.name)}>
                        Remove Faculty
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOMAIN REQUESTS TAB */}
        {tab === 'domains' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>Custom Domain Requests Verification</h3>
            </div>
            {domainRequests.length ? (
              <table>
                <thead>
                  <tr><th>Project Title</th><th>Student</th><th>Proposed Domain</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {domainRequests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.projectTitle}</td>
                      <td>{r.studentName}</td>
                      <td><span className="badge badge-yellow">{r.proposedDomain}</span></td>
                      <td style={{ color: 'var(--muted)' }}>{r.submittedAt}</td>
                      <td><span className={`badge ${r.status === 'Pending' ? 'badge-yellow' : 'badge-green'}`}>{r.status}</span></td>
                      <td>
                        {r.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleResolveDomain(r.id, 'approve', r.proposedDomain)}>
                              Approve Domain & Assign Faculty
                            </button>
                            <button className="btn btn-danger-outline btn-sm" onClick={() => handleResolveDomain(r.id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty" style={{ padding: '30px' }}><Icon name="check" size={30} /><div>No pending custom domain requests.</div></div>
            )}
          </div>
        )}

        {/* PROJECT REPORTS TAB */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>Reported Projects Moderation Queue</h3>
            </div>
            {reports.length ? (
              <table>
                <thead>
                  <tr><th>Project</th><th>Reporter</th><th>Category</th><th>Assigned Reviewer</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.projectTitle}</td>
                      <td>{r.reporter}</td>
                      <td><span className="badge badge-gray">{r.category}</span></td>
                      <td style={{ color: '#38bdf8', fontWeight: 500 }}>{r.assignedFaculty || 'Administrator'}</td>
                      <td><span className={`badge ${r.status === 'Pending' ? 'badge-yellow' : 'badge-gray'}`}>{r.status}</span></td>
                      <td>
                        {r.status === 'Pending' ? (
                          <button className="btn btn-outline btn-sm" onClick={() => setInspectReport(r)}>
                            Review Report
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
              <div className="empty" style={{ padding: '30px' }}><Icon name="check" size={30} /><div>No reported projects at this time.</div></div>
            )}
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {tab === 'departments' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <form onSubmit={handleAddDepartment} style={{ display: 'flex', gap: '10px' }}>
                <input
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '12px', width: '250px' }}
                  placeholder="e.g. Aerospace Engineering"
                />
                <button type="submit" className="btn btn-primary btn-sm">Add Department</button>
              </form>
            </div>
            <table>
              <thead>
                <tr><th>Department Name</th></tr>
              </thead>
              <tbody>
                {departments.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ACCESS TIERS TAB */}
        {tab === 'tiers' && (
          <form onSubmit={handleSaveTiers} style={{ maxWidth: '400px', marginTop: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '18px' }}>
              Edit credit point thresholds for repository tier access.
            </p>
            <div className="field">
              <label>Ideas Repository Access (Credits)</label>
              <input type="number" value={tierIdea} onChange={(e) => setTierIdea(e.target.value)} required />
            </div>
            <div className="field">
              <label>Internal Projects Access (Credits)</label>
              <input type="number" value={tierInternal} onChange={(e) => setTierInternal(e.target.value)} required />
            </div>
            <div className="field">
              <label>External Projects Access (Credits)</label>
              <input type="number" value={tierExternal} onChange={(e) => setTierExternal(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Save Tiers Settings</button>
          </form>
        )}
      </div>

      {/* MODAL: ADD USER */}
      {addUserModal && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setAddUserModal(false)}>
          <div className="modal">
            <h3>Add User Account</h3>
            <p className="hint">Register a new student, faculty, or admin account.</p>
            <form onSubmit={handleAddUser}>
              <div className="field"><label>Full name</label><input required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="e.g. Meenakshi Natarajan" /></div>
              <div className="field"><label>Email</label><input required type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@university.edu" /></div>
              <div className="field">
                <label>Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ background: 'rgba(3,7,18,0.4)', color: 'var(--text)' }}>
                  <option>Student</option>
                  <option>Faculty</option>
                  <option>Administrator</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add user</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FACULTY CONFIG */}
      {configFaculty && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfigFaculty(null)}>
          <div className="modal">
            <h3>Configure {configFaculty.name}</h3>
            <p className="hint">Edit domain specializations and pending workload threshold.</p>
            <form onSubmit={handleSaveFacultyConfig}>
              <div className="field">
                <label>Domain Specializations (comma separated)</label>
                <input required value={facultySpecs} onChange={(e) => setFacultySpecs(e.target.value)} placeholder="e.g. Machine Learning, Cloud Computing" />
              </div>
              <div className="field">
                <label>Max Pending Review Workload Threshold</label>
                <input required type="number" value={facultyThreshold} onChange={(e) => setFacultyThreshold(e.target.value)} placeholder="10" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setConfigFaculty(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT REPORT WITH REMARK */}
      {inspectReport && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setInspectReport(null)}>
          <div className="modal" style={{ width: '540px' }}>
            <h3>Inspect Violation Report</h3>
            <div style={{ background: 'rgba(15,23,42,0.8)', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>Project: {inspectReport.projectTitle}</div>
              <div style={{ color: 'var(--muted)', marginTop: '2px' }}>Reporter: <b>{inspectReport.reporter}</b> &middot; Category: {inspectReport.category}</div>
              <div style={{ color: '#cbd5e1', marginTop: '6px' }}>Reason: "{inspectReport.reason}"</div>
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <label style={{ color: '#fbbf24', fontWeight: 600 }}>Resolution Remark (Required):</label>
              <textarea
                required
                rows="3"
                value={reportRemark}
                onChange={(e) => setReportRemark(e.target.value)}
                placeholder="Enter investigation remark..."
              ></textarea>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon name="alert" size={13} style={{ color: '#fbbf24' }} />
                <span>Dismissing an invalid report applies a <b>-5 credit penalty</b> to reporter ({inspectReport.reporter}).</span>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setInspectReport(null)}>Cancel</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ color: '#fb7185' }} onClick={() => handleResolveReport(inspectReport.id, 'reject')}>
                  Dismiss (Apply -5 Penalty)
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
