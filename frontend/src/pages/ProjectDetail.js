import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, getPriorityColor, getInitials, getStatusLabel } from '../utils/helpers';

const STATUSES = ['todo', 'in_progress', 'done'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const isAdmin = project?.members?.find(m => m.user?._id === user?._id)?.role === 'admin';

  const fetchData = useCallback(() => {
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/tasks`)
    ]).then(([projRes, tasksRes]) => {
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    }).catch(err => {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    }).finally(() => setLoading(false));
  }, [projectId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  if (loading) return <Layout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" style={{ width: 36, height: 36 }}></div></div></Layout>;

  return (
    <Layout>
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project?.color }}></div>
            <h1 style={styles.title}>{project?.name}</h1>
            {!isAdmin && <span style={styles.roleBadge}>Member</span>}
            {isAdmin && <span style={{ ...styles.roleBadge, background: 'rgba(124,106,247,0.2)', color: 'var(--accent3)' }}>Admin</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(true)}>Members ({project?.members?.length})</button>}
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Add Task</button>}
          </div>
        </div>

        {project?.description && <p style={styles.desc}>{project.description}</p>}

        {/* Tabs + Filters */}
        <div style={styles.toolbar}>
          <div style={styles.tabs}>
            {['board', 'list'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
                {tab === 'board' ? '⊞ Board' : '≡ List'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" style={{ padding: '6px 10px', fontSize: 13, width: 'auto' }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="input" style={{ padding: '6px 10px', fontSize: 13, width: 'auto' }}
              value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Board View */}
        {activeTab === 'board' && (
          <div style={styles.board}>
            {STATUSES.map(status => {
              const col = tasksByStatus[status] || [];
              const colConfig = {
                todo: { label: 'To Do', accent: 'var(--text3)' },
                in_progress: { label: 'In Progress', accent: 'var(--warning)' },
                done: { label: 'Done', accent: 'var(--success)' }
              }[status];
              return (
                <div key={status} style={styles.column}>
                  <div style={styles.colHeader}>
                    <span style={{ ...styles.colDot, background: colConfig.accent }}></span>
                    <span style={styles.colLabel}>{colConfig.label}</span>
                    <span style={styles.colCount}>{col.length}</span>
                  </div>
                  <div style={styles.colBody}>
                    {col.map(task => (
                      <TaskCard key={task._id} task={task} isAdmin={isAdmin} userId={user._id}
                        onEdit={() => { setEditingTask(task); setShowTaskModal(true); }}
                        onStatusChange={async (newStatus) => {
                          await api.patch(`/projects/${projectId}/tasks/${task._id}`, { status: newStatus });
                          fetchData();
                        }} />
                    ))}
                    {col.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="card" style={{ marginTop: 0 }}>
            {filteredTasks.length === 0 ? (
              <div className="empty-state"><p>No tasks found.</p></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Title','Assignee','Priority','Status','Due Date','Actions'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {task.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ width: 24, height: 24, background: 'var(--accent)', color: '#fff', fontSize: 10 }}>{getInitials(task.assignedTo.name)}</div>
                            <span style={{ fontSize: 12 }}>{task.assignedTo.name}</span>
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'var(--text3)' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: getPriorityColor(task.priority), textTransform: 'uppercase' }}>{task.priority}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {(isAdmin || task.assignedTo?._id === user._id) ? (
                          <select value={task.status} onChange={async e => {
                            await api.patch(`/projects/${projectId}/tasks/${task._id}`, { status: e.target.value });
                            fetchData();
                          }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        ) : (
                          <StatusBadge status={task.status} />
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : 'var(--text2)' }}>
                        {formatDate(task.dueDate)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={async () => {
                              if (window.confirm('Delete this task?')) {
                                await api.delete(`/projects/${projectId}/tasks/${task._id}`);
                                fetchData();
                              }
                            }}>Del</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          members={project?.members || []}
          isAdmin={isAdmin}
          onClose={() => setShowTaskModal(false)}
          onSave={() => { setShowTaskModal(false); fetchData(); }}
        />
      )}

      {showMemberModal && isAdmin && (
        <MemberModal
          project={project}
          onClose={() => setShowMemberModal(false)}
          onSave={() => { setShowMemberModal(false); fetchData(); }}
          isAdmin={isAdmin}
          currentUserId={user._id}
        />
      )}
    </Layout>
  );
}

function TaskCard({ task, isAdmin, userId, onEdit, onStatusChange }) {
  const canEdit = isAdmin || task.assignedTo?._id === userId;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div style={styles.taskCard}>
      <div style={styles.taskTop}>
        <span style={{ ...styles.priorityBadge, color: getPriorityColor(task.priority), background: getPriorityColor(task.priority) + '20' }}>{task.priority}</span>
        {isAdmin && <button style={styles.editBtn} onClick={onEdit}>✎</button>}
      </div>
      <div style={styles.taskTitle}>{task.title}</div>
      {task.description && <p style={styles.taskDesc}>{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</p>}
      <div style={styles.taskFooter}>
        {task.assignedTo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="avatar" style={{ width: 22, height: 22, background: 'var(--accent)', color: '#fff', fontSize: 9 }}>{getInitials(task.assignedTo.name)}</div>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{task.assignedTo.name}</span>
          </div>
        ) : <span style={{ fontSize: 11, color: 'var(--text3)' }}>Unassigned</span>}
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text3)' }}>
            {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
          </span>
        )}
      </div>
      {canEdit && task.status !== 'done' && (
        <button style={styles.moveBtn} onClick={() => onStatusChange(task.status === 'todo' ? 'in_progress' : 'done')}>
          {task.status === 'todo' ? 'Start →' : '✓ Done'}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = { todo: ['rgba(148,163,184,0.15)', '#94a3b8', 'To Do'], in_progress: ['rgba(245,158,11,0.15)', '#f59e0b', 'In Progress'], done: ['rgba(34,197,94,0.15)', '#22c55e', 'Done'] };
  const [bg, color, label] = config[status] || config.todo;
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{label}</span>;
}

function TaskModal({ projectId, task, members, isAdmin, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assignedTo: task?.assignedTo?._id || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (task) {
        await api.patch(`/projects/${projectId}/tasks/${task._id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/tasks`, payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/projects/${projectId}/tasks/${task._id}`);
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add details..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
            <div>
              {task && isAdmin && (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ project, onClose, onSave, isAdmin, currentUserId }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/projects/${project._id}/members`, { email, role });
      setEmail('');
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${project._id}/members/${memberId}`);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Project Members</h2>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {project.members?.map(m => (
            <div key={m.user?._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
              <div className="avatar" style={{ width: 32, height: 32, background: 'var(--accent)', color: '#fff', fontSize: 12 }}>{getInitials(m.user?.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.user?.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: m.role === 'admin' ? 'var(--accent3)' : 'var(--text3)', textTransform: 'uppercase', padding: '2px 8px', background: m.role === 'admin' ? 'rgba(124,106,247,0.15)' : 'var(--bg)', borderRadius: 20 }}>{m.role}</span>
              {isAdmin && m.user?._id !== currentUserId && m.user?._id !== project.createdBy?._id && (
                <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }} onClick={() => handleRemove(m.user._id)}>×</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600 }}>Add Member</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
              <select className="input" style={{ width: 'auto' }} value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        )}
        {!isAdmin && <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', marginTop: 16 }}>Close</button>}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '28px 32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800 },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(148,163,184,0.15)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  desc: { fontSize: 14, color: 'var(--text2)', marginBottom: 20 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  tabs: { display: 'flex', gap: 2, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 },
  tab: { padding: '6px 14px', border: 'none', background: 'none', color: 'var(--text2)', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  tabActive: { background: 'var(--bg3)', color: 'var(--text)' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  column: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  colHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  colDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  colLabel: { fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, flex: 1 },
  colCount: { fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 7px', borderRadius: 20, fontWeight: 600 },
  colBody: { padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 },
  taskCard: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, letterSpacing: '0.5px' },
  editBtn: { background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: '0 2px' },
  taskTitle: { fontWeight: 600, fontSize: 13, marginBottom: 6, lineHeight: 1.4 },
  taskDesc: { fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.4 },
  taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  moveBtn: { display: 'block', width: '100%', marginTop: 10, padding: '5px', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)', color: 'var(--accent3)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }
};
