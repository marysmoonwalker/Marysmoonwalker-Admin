import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, TrendingUp, MessageSquare,
  Plus, LogOut, ChevronLeft, ChevronRight, X, Tags, Sun, Moon,
  MessageCircle,
  TrafficCone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActiveView } from '../App';

const ACCENT        = '#FF8C00';
const ACCENT_BORDER = 'rgba(255,140,0,0.2)';
const ACCENT_MUTED  = 'rgba(255,140,0,0.08)';
const ACCENT_ACTIVE = 'rgba(255,140,0,0.15)';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

const navItems = [
  { id: 'dashboard'  as ActiveView, label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'posts'      as ActiveView, label: 'Blog Posts',   icon: FileText        },
  { id: 'categories' as ActiveView, label: 'Categories',   icon: Tags            },
  // { id: 'create'     as ActiveView, label: 'New Post',     icon: Plus            },
  { id: 'curation'   as ActiveView, label: 'Curation Hub', icon: TrendingUp      },
  { id: 'forum'      as ActiveView, label: 'Forum',        icon: MessageSquare   },
  { id: 'outreach'   as ActiveView, label: 'Outreach',     icon: MessageCircle     },
  { id: 'traffic'    as ActiveView, label: 'Traffic',      icon: TrafficCone     },
];

export default function Sidebar({
  activeView,
  onNavigate,
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() => {
      const saved = localStorage.getItem('admin-theme');
      const dark = saved ? saved === 'dark' : true; // default = dark

      // Apply immediately — before first render, no flash
      if (dark) {
          document.documentElement.classList.remove('light-mode');
      } else {
          document.documentElement.classList.add('light-mode');
      }

      return dark;
  });

  useEffect(() => {
      if (isDark) {
          document.documentElement.classList.remove('light-mode');
          localStorage.setItem('admin-theme', 'dark');
      } else {
          document.documentElement.classList.add('light-mode');
          localStorage.setItem('admin-theme', 'light');
      }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);
  // ─────────────────────────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const sidebarBg    = isDark ? '#0D0D0D' : '#FFFFFF';
  const inactiveText = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const labelColor   = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${ACCENT_BORDER}` }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full hidden md:flex items-center justify-center border-2 hover:scale-110 transition-transform"
          style={{ backgroundColor: ACCENT, color: '#000', borderColor: sidebarBg }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute right-4 top-6 md:hidden"
          style={{ color: inactiveText }}
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="p-6 overflow-hidden" style={{ borderBottom: `1px solid ${ACCENT_BORDER}` }}>
          <a href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="https://i.pinimg.com/1200x/6a/9f/01/6a9f01bc9359ff96f64da7e08ddede99.jpg"
                alt="Mary's Moonwalker"
                className="w-full h-full object-cover"
              />
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="animate-fade-in whitespace-nowrap">
                <h1 className="font-bold text-sm tracking-widest uppercase" style={{ color: ACCENT }}>
                  Moonwalker
                </h1>
                <p className="text-xs" style={{ color: inactiveText }}>Control Panel</p>
              </div>
            )}
          </a>
        </div>

        {/* Nav Items */}
        <div className="px-3 py-2 mt-2 flex-1">
          {(!isCollapsed || isMobileMenuOpen) && (
            <p className="text-xs font-semibold tracking-widest uppercase px-3 mb-2 animate-fade-in" style={{ color: labelColor }}>
              Main Menu
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id || (activeView === 'edit' && id === 'posts');
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  title={isCollapsed ? label : ''}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative overflow-hidden"
                  style={{
                    color: isActive ? ACCENT : inactiveText,
                    background: isActive ? ACCENT_ACTIVE : 'transparent',
                    border: isActive ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                      (e.currentTarget as HTMLButtonElement).style.background = ACCENT_MUTED;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = inactiveText;
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-0.5 rounded-r-full" style={{ backgroundColor: ACCENT }} />
                  )}
                  <Icon size={18} className={`flex-shrink-0 transition-transform duration-300 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <span className="animate-fade-in whitespace-nowrap" style={{ color: isActive ? ACCENT : isDark ? '#FFFFFF' : '#111111' }}>
                      {label}
                    </span>
                  )}
                  {(!isCollapsed || isMobileMenuOpen) && id === 'create' && (
                    <span
                      className="ml-auto w-5 h-5 rounded text-xs flex items-center justify-center font-bold"
                      style={{ backgroundColor: ACCENT_ACTIVE, color: ACCENT }}
                    >
                      +
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 mt-4">
          {(!isCollapsed || isMobileMenuOpen) && (
            <p className="text-xs font-semibold tracking-widest uppercase px-3 mb-2 animate-fade-in" style={{ color: labelColor }}>
              Appearance
            </p>
          )}
          <button
            onClick={toggleTheme}
            title={isCollapsed ? (isDark ? 'Switch to Light' : 'Switch to Dark') : ''}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group"
            style={{ color: inactiveText, border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
              (e.currentTarget as HTMLButtonElement).style.background = ACCENT_MUTED;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = inactiveText;
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {isDark
              ? <Sun  size={18} className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-500" />
              : <Moon size={18} className="flex-shrink-0 group-hover:-rotate-12 transition-transform duration-500" />
            }
            {(!isCollapsed || isMobileMenuOpen) && (
              <span className="animate-fade-in" style={{ color: isDark ? '#FFFFFF' : '#111111' }}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>

        {/* User + Logout */}
        <div className="mt-auto p-4" style={{ borderTop: `1px solid ${ACCENT_BORDER}` }}>
          <div className="flex items-center gap-3 mb-4 overflow-hidden">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #994f00)`, color: '#000' }}
                >
                  {getInitials(user?.fullName || 'Admin')}
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="animate-fade-in whitespace-nowrap overflow-hidden">
                <p className="text-sm font-medium truncate w-32" style={{ color: isDark ? '#FFFFFF' : '#111111' }}>
                  {user?.fullName || 'Admin User'}
                </p>
                <p className="text-xs capitalize" style={{ color: inactiveText }}>
                  {user?.role === 'admin' ? 'Super Admin' : user?.role || 'Admin'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300 group overflow-hidden"
          >
            <LogOut size={16} className="flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
            {(!isCollapsed || isMobileMenuOpen) && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}