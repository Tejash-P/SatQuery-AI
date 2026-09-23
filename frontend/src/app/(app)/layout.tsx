'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderOpen, LogOut, ChevronRight, User, Menu, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import BrandLogo from '@/components/BrandLogo';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, token, fetchMe, logout } = useAuthStore();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Viewer';
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!token) {
        router.push('/auth/login');
      } else if (!user) {
        fetchMe();
      }
    }
  }, [mounted, token, user, fetchMe, router]);

  if (!mounted || !token) return null;

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { href: '/projects', icon: <FolderOpen size={16} />, label: 'Projects' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <button
        className={`sidebar-toggle ${sidebarOpen ? 'sidebar-toggle-open' : ''}`}
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={17} /> : <Menu size={18} />}
      </button>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <BrandLogo compact className="app-brand-logo" />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '8px 8px 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                color: isActive ? 'var(--text-bright)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(26,111,223,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(26,111,223,0.3)' : '1px solid transparent',
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s'
              }}>
                <span style={{ color: isActive ? 'var(--accent-blue-light)' : 'var(--text-muted)' }}>{item.icon}</span>
                {item.label}
                {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--accent-blue-light)' }} />}
              </Link>
            );
          })}

        </nav>

        {/* User area */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            marginBottom: 8
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a6fdf, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <User size={14} color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span className={`role-badge role-${user?.role?.toLowerCase()}`}>{user?.role || 'VIEWER'}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || ''}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
