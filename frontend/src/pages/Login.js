import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg}></div>
      <div style={styles.container}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>TaskFlow</span>
        </div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your workspace</p>

        {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : null}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent3)', fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' },
  bg: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,106,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  container: { width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' },
  logoIcon: { fontSize: 26, color: 'var(--accent3)' },
  logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--text)' },
  title: { textAlign: 'center', fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 8 },
  subtitle: { textAlign: 'center', color: 'var(--text2)', marginBottom: 32, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, marginBottom: 24 },
  footer: { textAlign: 'center', color: 'var(--text2)', fontSize: 14 }
};
