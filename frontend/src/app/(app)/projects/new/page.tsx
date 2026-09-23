'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Satellite, ArrowLeft, FolderOpen } from 'lucide-react';
import { projectsApi } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await projectsApi.create(name.trim(), description.trim());
      router.push(`/projects/${res.data.id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create project.');
      setCreating(false);
    }
  };

  const templates = [
    { name: 'Deforestation Monitoring', desc: 'Track forest cover change over time using bi-temporal analysis.' },
    { name: 'Urban Expansion Study', desc: 'Measure city growth and encroachment on green zones.' },
    { name: 'Flood Extent Mapping', desc: 'Map inundated areas using SAR change detection.' },
    { name: 'Crop Health Assessment', desc: 'Monitor agricultural land using NDVI-based land cover mapping.' },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <div className="fade-in">
        <Link href="/projects" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 24, display: 'inline-flex' }}>
          <ArrowLeft size={13} /> Back to Projects
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(26,111,223,0.25), rgba(0,212,255,0.15))',
            border: '1px solid rgba(26,111,223,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FolderOpen size={22} color="var(--accent-blue-light)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
              Create New Project
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Set up a new satellite imagery analysis workspace
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-red-dim)', border: '1px solid rgba(255,69,87,0.3)', fontSize: 13, color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                id="new-project-name"
                className="input"
                placeholder="e.g., Western Ghats Change Analysis 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                placeholder="Describe your analysis objective, study area, and data sources…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: 100 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Link href="/projects" className="btn-secondary">Cancel</Link>
              <button id="new-project-submit" type="submit" className="btn-primary" disabled={!name.trim() || creating}>
                {creating ? 'Creating…' : 'Create & Open Project →'}
              </button>
            </div>
          </form>
        </div>

        {/* Templates */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Quick-start templates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {templates.map(t => (
              <button
                key={t.name}
                onClick={() => { setName(t.name); setDescription(t.desc); }}
                style={{
                  textAlign: 'left', padding: '14px 16px', cursor: 'pointer',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, transition: 'all 0.15s'
                }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
