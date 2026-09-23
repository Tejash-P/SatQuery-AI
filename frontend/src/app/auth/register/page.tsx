'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Particles from '@/components/Particles';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ANALYST' | 'VIEWER'>('VIEWER');
  const [showPass, setShowPass] = useState(false);
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await register(email, fullName, password, role);
    const { token } = useAuthStore.getState();
    if (token) router.push('/dashboard');
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Moderate', 'Strong'];
  const strengthColor = ['', '#ff4557', 'var(--accent-gold)', 'var(--accent-green)'];

  return (
    <div className="page-container grid-bg auth-particles-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="space-backdrop" aria-hidden="true" />
      <Particles
        particleColors={['#3b8eea', '#00d4ff', '#f0a500']}
        particleCount={180}
        particleSpread={12}
        speed={0.08}
        particleBaseSize={80}
        alphaParticles
      />
      <div style={{
        position: 'fixed', top: '30%', right: '-100px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="auth-content" style={{ width: '100%', maxWidth: 440, padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Join SatQuery AI — Remote Sensing Intelligence
          </p>
        </div>

        <div className="auth-card" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          {error && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '12px 14px', borderRadius: 8, marginBottom: 20,
              background: 'var(--accent-red-dim)', border: '1px solid rgba(255,69,87,0.3)'
            }}>
              <AlertCircle size={15} color="var(--accent-red)" />
              <span style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input id="register-name" type="text" className="input" placeholder="Dr. Priya Nair" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} required style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input id="register-email" type="email" className="input" placeholder="analyst@isro.gov.in" value={email}
                  onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 36 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input id="register-password" type={showPass ? 'text' : 'password'} className="input" placeholder="Min. 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ paddingLeft: 36, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= passwordStrength ? strengthColor[passwordStrength] : 'var(--border)',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                  <span style={{ fontSize: 11, color: strengthColor[passwordStrength], fontWeight: 600, marginLeft: 4 }}>
                    {strengthLabel[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-role">RBAC Role</label>
              <select id="register-role" className="input" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                <option value="VIEWER">Viewer — read-only access</option>
                <option value="ANALYST">Analyst — upload and analyze</option>
                <option value="ADMIN">Admin — full access</option>
              </select>
            </div>

            <button id="register-submit" type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }}>
              {isLoading ? 'Creating Account…' : 'Create Account & Launch →'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--accent-blue-light)', fontWeight: 500 }}>
              Sign In →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
