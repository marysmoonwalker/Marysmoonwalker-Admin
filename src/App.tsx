import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import PostManager from './components/PostManager';
import PostEditor from './components/PostEditor';
import CategoryManager from './components/CategoryManager';
import CuratedListManager from './components/CuratedListManager';
import ForumManager from './components/ForumManager';
import ThreadModerator from './components/ThreadModerator';
import { useAuth } from './context/AuthContext';
import AnalyticsDashboard from './components/Dashboard';
import OutreachManagement from './components/OutreachManagement';
import TrafficManagement from './components/TrafficManagement';
import UserRegistry from './components/UserRegistry';

export type ActiveView = 'dashboard' | 'posts' | 'categories' | 'curation' | 'forum' | 'create' | 'edit' | 'outreach' | 'traffic' | 'users';

// ─── Self-contained theme hook ────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(
    () => !document.documentElement.classList.contains('light-mode')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light-mode'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const isDark = useTheme();

  const bg   = isDark ? '#0A0A0A' : '#F8F9FA';
  const text = isDark ? '#FFFFFF'  : '#000000';

  const [currentPath, setCurrentPath]           = useState(window.location.pathname);
  const [activeView, setActiveView]             = useState<ActiveView>('dashboard');
  const [editingPostSlug, setEditingPostSlug]   = useState<string | null>(null);
  const [viewingThreadId, setViewingThreadId]   = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && currentPath !== '/login') {
        window.history.pushState({}, '', '/login');
        setCurrentPath('/login');
      } else if (isAuthenticated && currentPath === '/login') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
    }
  }, [isAuthenticated, isLoading, currentPath]);

  function handleNavigate(view: ActiveView) {
    if (view !== 'edit') setEditingPostSlug(null);
    if (view !== 'forum') setViewingThreadId(null);
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }

  function handleEdit(slug: string) {
    setEditingPostSlug(slug);
    setActiveView('edit');
    setIsMobileMenuOpen(false);
  }

  function handleSaveSuccess() {
    setActiveView('posts');
    setEditingPostSlug(null);
  }

  // Loading state — theme-aware
  if (isLoading) {
    return <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: bg }} />;
  }

  if (!isAuthenticated || currentPath === '/login') {
    return <Login />;
  }

  function renderContent() {
    switch (activeView) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'posts':
        return <PostManager onEdit={handleEdit} onCreate={() => handleNavigate('create')} />;
      case 'categories':
        return <CategoryManager />;
      case 'curation':
        return <CuratedListManager />;
      case 'traffic':
        return (
            <TrafficManagement
                onNavigateToUsers={() => handleNavigate('users')}
            />
        );
      case 'users':
        return (
            <UserRegistry
                onBack={() => handleNavigate('traffic')}
            />
        );  
      case 'outreach':
        return <OutreachManagement />;
      case 'forum':
        if (viewingThreadId) {
          return <ThreadModerator threadId={viewingThreadId} onBack={() => setViewingThreadId(null)} />;
        }
        return <ForumManager onView={(id) => setViewingThreadId(id)} />;
      case 'create':
        return <PostEditor onSave={handleSaveSuccess} onCancel={() => handleNavigate('posts')} />;
      case 'edit':
        return <PostEditor postSlug={editingPostSlug || undefined} onSave={handleSaveSuccess} onCancel={() => handleNavigate('posts')} />;
      default:
        return <PostManager onEdit={handleEdit} onCreate={() => handleNavigate('create')} />;
    }
  }

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ backgroundColor: bg, color: text }}
    >
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}>
        <Header
          activeView={activeView}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main
          className="flex-1 p-4 md:p-6 transition-colors duration-300"
          style={{ backgroundColor: bg }}
        >
          <div key={activeView} className="animate-fade-in-up">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Sidebar bottom glow — updated to FF8C00 */}
      <div
        className={`fixed bottom-0 left-0 h-32 pointer-events-none transition-all duration-300 hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        style={{ background: 'linear-gradient(to top, rgba(255,140,0,0.05), transparent)' }}
      />

      {/* Top-right ambient glow — updated to FF8C00 */}
      <div
        className="fixed top-0 right-0 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.04), transparent)' }}
      />
    </div>
  );
}