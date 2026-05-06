import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getInitials } from '../utils/helpers';

const PROJECT_COLORS = ['#7c6af7','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6','#f97316'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(res => setProjects(res.data.projects)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', color: PROJECT_COLORS[0] });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Projects</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}></div></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>Create project</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {projects.map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} style={styles.projectCard}>
                <div style={{ ...styles.colorBar, background: project.color }}></div>
                <div style={styles.cardBody}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.projectName}>{project.name}</h3>
                    <span style={styles.memberCount}>{project.members?.length || 0} members</span>
                  </div>
                  {project.description && (
                    <p style={styles.desc}>{project.description}</p>
                  )}
                  <div style={styles.cardFooter}>
                    <div style={{ display: 'flex', gap: -6 }}>
                      {project.members?.slice(0, 4).map((m, i) => (
                        <div key={m.user?._id || i} className="avatar" style={{
                          width: 26, height: 26, fontSize: 10,
                          background: m.role === 'admin' ? project.color : 'var(--bg3)',
                          color: m.role === 'admin' ? '#fff' : 'var(--text2)',
                          border: '2px solid var(--bg2)',
                          marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i
                        }}>
                          {getInitials(m.user?.name)}
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: project.color }}>{project.taskCount || 0}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>tasks</span>
                    </div>
                  </div>
                  {project.taskCount > 0 && (
                    <div style={styles.progressBg}>
                      <div style={{ ...styles.progressBar, width: `${Math.round((project.completedCount || 0) / project.taskCount * 100)}%`, background: project.color }}></div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 style={styles.modalTitle}>New Project</h2>
            {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="label">Project name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PROJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  page: { padding: '32px 36px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  projectCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
    overflow: 'hidden', textDecoration: 'none', display: 'block',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  colorBar: { height: 4 },
  cardBody: { padding: '18px 20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  projectName: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)' },
  memberCount: { fontSize: 11, color: 'var(--text3)', flexShrink: 0 },
  desc: { fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  progressBg: { height: 4, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  modalTitle: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 20 }
};
