'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  FolderOpen, Plus, Satellite, Trash2, ArrowRight, Search, X, Clock, ChevronRight
} from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  aoi_wkt?: string;
  owner_email?: string;
  owner_role?: string;
}

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const canWrite = role === 'ADMIN' || role === 'ANALYST';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await projectsApi.create(newName.trim(), newDesc.trim());
      setNewName(''); setNewDesc(''); setShowNew(false);
      fetchProjects();
    } catch {
      setError('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await projectsApi.delete(id).catch(() => {});
    fetchProjects();
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
            Projects
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage your satellite imagery analysis workspaces
          </p>
        </div>
        {canWrite && (
          <button
            id="create-project-btn"
            className="btn-primary"
            onClick={() => setShowNew(true)}
            style={{ fontSize: 13 }}
          >
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="input"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36, paddingRight: search ? 36 : 14 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* New Project Modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(5,11,24,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440,
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
          }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)' }}>
                New Project
              </h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  id="project-name-input"
                  className="input"
                  placeholder="e.g., Western Ghats Change Analysis 2024"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Brief description of the analysis objective…"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                <button id="create-project-submit" type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Project →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
          <FolderOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {search ? 'No projects match your search' : 'No projects yet'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {search ? 'Try a different search term.' : 'Create a project to start analyzing satellite imagery.'}
          </p>
          {!search && canWrite && (
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', height: '100%', position: 'relative', minHeight: 130 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(26,111,223,0.2), rgba(0,212,255,0.1))',
                    border: '1px solid rgba(26,111,223,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Satellite size={17} color="var(--accent-blue-light)" />
                  </div>
                  {canWrite && (
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: 4 }}
                      className="btn-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{p.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                  {p.description || 'No description provided.'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Created by {p.owner_email || 'Unknown user'} ({p.owner_role || 'USER'})
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={10} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Open <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
