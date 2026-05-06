import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { formatDate, isOverdue, getPriorityColor, getStatusLabel, getInitials } from '../utils/helpers';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }}></div>
      </div>
    </Layout>
  );

  const stats = data?.stats || {};
  const statCards = [
    { label: 'Total Tasks', value: stats.totalTasks || 0, color: 'var(--accent3)' },
    { label: 'To Do', value: stats.todoTasks || 0, color: 'var(--text2)' },
    { label: 'In Progress', value: stats.inProgressTasks || 0, color: 'var(--warning)' },
    { label: 'Completed', value: stats.doneTasks || 0, color: 'var(--success)' },
    { label: 'Overdue', value: stats.overdueTasks || 0, color: 'var(--danger)' },
    { label: 'Projects', value: stats.totalProjects || 0, color: 'var(--accent)' },
  ];

  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Here's what's happening across your projects</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          {statCards.map(stat => (
            <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: 32, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.twoCol}>
          {/* My Tasks */}
          <div className="card" style={{ flex: 1 }}>
            <h2 style={styles.cardTitle}>My Tasks</h2>
            {data?.myTasks?.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No tasks assigned to you yet.</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {data?.myTasks?.map(task => (
                <Link key={task._id} to={`/projects/${task.project?._id}`} style={styles.taskRow}>
                  <div style={{ ...styles.priorityDot, background: getPriorityColor(task.priority) }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: task.status === 'done' ? 'var(--text3)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {task.project?.name} · {getStatusLabel(task.status)}
                    </div>
                  </div>
                  {task.dueDate && (
                    <span style={{ fontSize: 11, color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : 'var(--text3)', flexShrink: 0 }}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Tasks per member */}
          <div className="card" style={{ flex: 1 }}>
            <h2 style={styles.cardTitle}>Team Workload</h2>
            {data?.tasksByMember?.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 0' }}><p>No assigned tasks yet.</p></div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {data?.tasksByMember?.map(m => {
                const pct = m.count > 0 ? Math.round((m.done / m.count) * 100) : 0;
                return (
                  <div key={m._id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div className="avatar" style={{ width: 28, height: 28, background: 'var(--accent)', color: '#fff', fontSize: 11 }}>
                        {getInitials(m.user?.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{m.user?.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.done}/{m.count}</span>
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: 4, transition: 'width 0.6s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h2 style={styles.cardTitle}>Recent Activity</h2>
          {data?.recentTasks?.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>No recent tasks.</p></div>
          )}
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Task','Project','Assignee','Priority','Status','Due Date'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.recentTasks?.map(task => (
                  <tr key={task._id} style={styles.tr}>
                    <td style={styles.td}><span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span></td>
                    <td style={styles.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project?.color || 'var(--accent)', display: 'inline-block' }}></span>
                        {task.project?.name}
                      </span>
                    </td>
                    <td style={styles.td}><span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.assignedTo?.name || '—'}</span></td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: getPriorityColor(task.priority), textTransform: 'uppercase' }}>{task.priority}</span>
                    </td>
                    <td style={styles.td}>
                      <StatusBadge status={task.status} />
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : 'var(--text2)' }}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }) {
  const config = {
    todo: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'To Do' },
    in_progress: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'In Progress' },
    done: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Done' }
  };
  const c = config[status] || config.todo;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>;
}

const styles = {
  page: { padding: '32px 36px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  cardTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 },
  taskRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg3)', textDecoration: 'none' },
  priorityDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  tr: { transition: 'background 0.1s' }
};
