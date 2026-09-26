'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Shield, Layers, ArrowRight, Zap, Globe, Eye } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="page-container home-page" style={{ minHeight: '100vh' }}>
      <div className="space-backdrop" aria-hidden="true" />

      {/* Nav */}
      <nav className="home-nav" aria-label="Primary navigation" style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: 'calc(100% - 48px)', maxWidth: 1200,
        margin: '18px auto 0', padding: '12px 14px 12px 18px',
        border: '1px solid rgba(160, 137, 255, 0.24)',
        borderRadius: 18,
        background: 'rgba(9, 7, 30, 0.62)',
        boxShadow: '0 12px 40px rgba(3, 1, 18, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(18px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo compact className="home-brand-logo" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/auth/login" className="home-nav-signin">Sign In</Link>
          <Link href="/auth/register" className="home-nav-start">Get Started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="home-main" style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '80px 32px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }} className="fade-in">
          <h1 style={{
            fontFamily: 'Sora', fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 700, lineHeight: 1.1, marginBottom: 24,
            color: 'var(--text-bright)'
          }}>
            Agentic Intelligence for
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #1a6fdf, #00d4ff, #1a6fdf)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite'
            }}>
              Satellite Imagery
            </span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto 40px',
            lineHeight: 1.7
          }}>
            Ask natural language questions about your optical &amp; SAR satellite data.
            Get expert-level change detection, land-cover mapping, and cross-modal fusion—powered by an agentic AI engine.
          </p>

        </div>

        {/* Stats strip */}
        <div className="home-stats" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
          background: 'var(--border)', borderRadius: 12, overflow: 'hidden',
          marginBottom: 72, border: '1px solid var(--border)'
        }}>
          {[
            { label: 'Modalities', value: '2', sub: 'Optical + SAR' },
            { label: 'Analysis Tools', value: '5', sub: 'Agentic workflows' },
            { label: 'Export Formats', value: '4', sub: 'JSON, CSV, GeoJSON, PDF' },
            { label: 'Response Time', value: '<2s', sub: 'Real-time inference' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              padding: '24px 20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--accent-cyan)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="home-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 72 }}>
          {[
            {
              icon: <Brain size={22} color="#60a5fa" />,
              color: '#1a3f7a',
              title: 'Agentic Query Engine',
              desc: 'Natural language queries are classified and routed to specialized satellite analysis tools with full execution trace transparency.',
            },
            {
              icon: <Layers size={22} color="#c084fc" />,
              color: '#2d1a5a',
              title: 'Bi-Temporal Change Detection',
              desc: 'Compare T1/T2 scene pairs. Automatically identify deforestation, urban growth, flood extent, and land transitions.',
            },
            {
              icon: <Globe size={22} color="var(--accent-cyan)" />,
              color: '#002d3a',
              title: 'Optical + SAR Fusion',
              desc: 'Fuse spectral optical imagery with all-weather SAR microwave backscatter for cloud-penetrating scene understanding.',
            },
            {
              icon: <Eye size={22} color="#4ade80" />,
              color: '#00210d',
              title: 'Land-Cover Segmentation',
              desc: 'Multi-class surface classification with per-class area statistics in hectares and color-coded palette overlays.',
            },
            {
              icon: <Zap size={22} color="var(--accent-gold)" />,
              color: '#2d1f00',
              title: 'Text-Guided Grounding',
              desc: 'Locate specific objects — aircraft, ships, buildings — with bounding boxes and GeoJSON export.',
            },
            {
              icon: <Shield size={22} color="#fb923c" />,
              color: '#2d1000',
              title: 'Validated Confidence Scoring',
              desc: 'Every inference step is audited with sensor calibration checks, spatial co-registration validation, and confidence matrices.',
            },
          ].map((f) => (
            <div key={f.title} className="card" style={{ borderColor: 'var(--border)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, marginBottom: 16,
                background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="home-cta" style={{
          textAlign: 'center',
          padding: '48px 32px',
          background: 'linear-gradient(135deg, rgba(26,111,223,0.1), rgba(0,212,255,0.05))',
          border: '1px solid rgba(26,111,223,0.25)',
          borderRadius: 16
        }}>
          <h2 style={{ fontSize: 28, fontFamily: 'Sora', marginBottom: 12, color: 'var(--text-bright)' }}>
            Ready to analyze your imagery?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
            Create a free account and start your first satellite analysis in under 2 minutes.
          </p>
          <Link href="/auth/register" className="btn-primary" style={{ fontSize: 15, padding: '12px 32px' }}>
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer" style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)', fontSize: 12, marginTop: 60
      }}>
        SatQuery AI · Built by Phoenix Coders
      </footer>
    </div>
  );
}
