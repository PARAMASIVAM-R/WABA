import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAuth } from '../utils/api'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      saveAuth(data.token, data.role, data.hospital_id)
      navigate('/admin')
    } catch {
      setError('Server unreachable. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email, password) => setForm({ email, password })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5ede4 0%, #ede8e0 40%, #e8ddd4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 8%',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* decorative circles */}
      <div style={{ position: 'absolute', bottom: '-80px', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(249,115,22,0.08)' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '12%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(249,115,22,0.06)' }} />
      <div style={{ position: 'absolute', top: '10%', right: '42%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(249,115,22,0.05)' }} />

      {/* ── Left — branding ── */}
      <div style={{ flex: 1, paddingRight: '60px' }}>
        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: 'white',
            boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            flexShrink: 0,
          }}>🏥</div>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e3a5f', lineHeight: 1.1 }}>MediBook</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Make Healthcare Accessible &amp; Accurate</div>
          </div>
        </div>

        <div style={{ fontSize: '16px', color: '#9ca3af', fontWeight: '400', letterSpacing: '0.02em' }}>
          WhatsApp Appointment Portal
        </div>
      </div>

      {/* ── Right — login card ── */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '44px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
      }}>
        {/* orange accent bar */}
        <div style={{ width: '36px', height: '4px', backgroundColor: '#f97316', borderRadius: '2px', marginBottom: '20px' }} />

        <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#1e3a5f' }}>Welcome Back</h2>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#9ca3af' }}>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Username
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your username"
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                color: '#1e3a5f', backgroundColor: '#fafafa',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '12px 60px 12px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  color: '#1e3a5f', backgroundColor: '#fafafa',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', color: '#9ca3af',
              }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? '#fdba74' : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', border: 'none', borderRadius: '50px',
            fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
            letterSpacing: '0.03em',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo access */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={() => fillDemo('admin@hospital.com', 'Admin@1234')} style={{
              padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              background: 'white', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>Admin</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>admin@hospital.com</div>
            </button>
            <button onClick={() => fillDemo('admin@hospital.com', 'Admin@1234')} style={{
              padding: '10px', border: '1.5px solid #f97316', borderRadius: '10px',
              background: 'white', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f97316' }}>Receptionist</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>reception@hospital.com</div>
            </button>
          </div>
        </div>
      </div>

      {/* bottom powered by */}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
        Powered by
        <span style={{ fontWeight: '700', color: '#f97316' }}>MediBook</span>
      </div>
    </div>
  )
}

export default Login
