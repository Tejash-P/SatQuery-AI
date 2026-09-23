'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  FolderOpen, Plus, Satellite, Brain, Image, GitMerge,
  Activity, TrendingUp, Clock, ArrowRight, Radar, ScanLine, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/lib/api';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  owner_email?: string;
  owner_role?: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const canWrite = role === 'ADMIN' || role === 'ANALYST';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Viewer';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list().then((res) => {
      setProjects(res.data.slice(0, 4));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: <FolderOpen size={18} />, label: 'Projects', value: projects.length, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { icon: <Image size={18} />, label: 'Images Uploaded', value: '–', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    { icon: <Brain size={18} />, label: 'Analyses Run', value: '–', color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)' },
    { icon: <Activity size={18} />, label: 'System Status', value: 'Online', color: 'var(--accent-green)', bg: 'rgba(0,230,118,0.08)' },
  ];

  const quickActions = [
    { icon: <Plus size={20} />, label: 'New Project', desc: 'Start a new analysis workspace', href: '/projects/new', color: '#1a6fdf' },
    { icon: <Brain size={20} />, label: 'Run Analysis', desc: 'Submit a natural language query', href: '/projects', color: '#7c3aed' },
    { icon: <GitMerge size={20} />, label: 'Create Image Pair', desc: 'Build bi-temporal / optical-SAR pair', href: '/projects', color: '#0891b2' },
    { icon: <TrendingUp size={20} />, label: 'View Results', desc: 'Review past analysis sessions', href: '/projects', color: '#16a34a' },
  ].filter((action) => canWrite || action.label === 'View Results');

  return (
    <div className="dashboard-page" style={{ padding: '32px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      <section className="dashboard-hero fade-in">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="dashboard-orbit-visual" aria-hidden="true">
          <div className="dashboard-orbit-ring dashboard-orbit-ring-wide" />
          <div className="dashboard-orbit-ring dashboard-orbit-ring-tight" />
          <div className="dashboard-orbit-scan" />
          <div className="dashboard-orbit-core"><Satellite size={22} /></div>
          <span className="dashboard-orbit-point dashboard-orbit-point-one" />
          <span className="dashboard-orbit-point dashboard-orbit-point-two" />
          <span className="dashboard-orbit-label dashboard-orbit-label-one">LIVE FEED</span>
          <span className="dashboard-orbit-label dashboard-orbit-label-two">ORB / 07</span>
        </div>
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">
            <span className="dashboard-status-dot" />
            <span>MISSION CONTROL / ONLINE</span>
          </div>
          <h1>Welcome back, {displayName.split(' ')[0]}</h1>
          <p>Turn satellite imagery into grounded intelligence from one focused workspace.</p>
          <div className="dashboard-hero-meta">
            <span><Radar size={14} /> Remote sensing workspace</span>
            <span><ShieldCheck size={14} /> Local processing ready</span>
          </div>
        </div>
        {canWrite ? (
          <Link href="/projects/new" className="dashboard-hero-action">
            <Plus size={17} /> New project
            <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="dashboard-role-note"><ShieldCheck size={15} /> Read-only workspace</div>
        )}
      </section>

      <div className="dashboard-section-label"><span>Workspace telemetry</span><span>Live snapshot</span></div>
      <div className="dashboard-stats">
        {stats.map((s, index) => (
          <div key={s.label} className="dashboard-stat fade-in" style={{ '--stat-color': s.color, '--stat-bg': s.bg } as CSSProperties}>
            <div className="dashboard-stat-icon">
              {s.icon}
            </div>
            <div>
              <div className="dashboard-stat-index">0{index + 1}</div>
              <div className="dashboard-stat-value">{s.value}</div>
              <div className="dashboard-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="dashboard-heading-row">
            <div>
              <div className="dashboard-overline">Active workspaces</div>
              <h2>
              Recent Projects
              </h2>
            </div>
            <Link href="/projects" className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="dashboard-empty card">
              <ScanLine size={40} color="var(--accent-cyan)" style={{ margin: '0 auto 14px' }} />
              <h3>No projects yet</h3>
              <p>
                Create your first project to start analyzing satellite imagery.
              </p>
              {canWrite && (
                <Link href="/projects/new" className="btn-primary" style={{ fontSize: 13 }}>
                  <Plus size={14} /> Create Project
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="dashboard-project card">
                    <div className="dashboard-project-icon">
                      <Satellite size={18} color="var(--accent-blue-light)" />
                    </div>
                    <div className="dashboard-project-copy">
                      <div className="dashboard-project-name">{p.name}</div>
                      <div className="dashboard-project-description">
                        {p.description || 'No description'}
                      </div>
                      <div className="dashboard-project-description">
                        Created by {p.owner_email || 'Unknown user'} ({p.owner_role || 'USER'})
                      </div>
                    </div>
                    <div className="dashboard-project-date">
                      <Clock size={11} color="var(--text-muted)" />
                      <span>
                        {new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
              {canWrite && (
                <Link href="/projects/new" className="btn-secondary" style={{ justifyContent: 'center', marginTop: 4 }}>
                  <Plus size={14} /> New Project
                </Link>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="dashboard-actions-panel">
            <div className="dashboard-overline">Command deck</div>
            <h2>Quick Actions</h2>
            <div className="dashboard-actions-list">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                  <div className="dashboard-action">
                    <div className="dashboard-action-icon" style={{ '--action-color': a.color } as CSSProperties}>
                      {a.icon}
                    </div>
                    <div>
                      <div className="dashboard-action-label">{a.label}</div>
                      <div className="dashboard-action-description">{a.desc}</div>
                    </div>
                    <ArrowRight size={13} className="dashboard-action-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
