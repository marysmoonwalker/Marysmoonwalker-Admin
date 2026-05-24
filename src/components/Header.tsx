// import { Menu, Bell, User } from 'lucide-react';
// import { ActiveView } from '../App';
// import { useAuth } from '../context/AuthContext';

// interface HeaderProps {
//   activeView: ActiveView;
//   setIsMobileMenuOpen: (val: boolean) => void;
// }

// export default function Header({ activeView, setIsMobileMenuOpen }: HeaderProps) {
//   const { user } = useAuth();

//   const getTitle = (view: ActiveView) => {
//     switch (view) {
//       case 'dashboard': return 'Dashboard Overview';
//       case 'posts': return 'Content Management';
//       case 'categories': return 'Category Taxonomy';
//       case 'curation': return 'Homepage Curation';
//       case 'create': return 'New Article';
//       case 'edit': return 'Editor';
//       case 'forum': return 'Forum Moderation';
//       default: return 'MJ Admin';
//     }
//   };

//   return (
//     <header className="h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
//       <div className="flex items-center gap-4">
//         <button 
//           onClick={() => setIsMobileMenuOpen(true)}
//           className="p-2 hover:bg-white/5 rounded-lg md:hidden text-gray-400"
//         >
//           <Menu size={20} />
//         </button>
//         <h2 className="text-lg font-bold text-white tracking-tight">
//           {getTitle(activeView)}
//         </h2>
//       </div>

//       <div className="flex items-center gap-2 md:gap-4">
//         <button className="p-2 text-gray-400 hover:text-[#C9A84C] transition-colors relative">
//           <Bell size={20} />
//           <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A84C] rounded-full border-2 border-[#0a0a0a]"></span>
//         </button>
        
//         <div className="h-8 w-[1px] bg-gray-800 mx-2 hidden md:block"></div>

//         <div className="flex items-center gap-3 pl-2">
//           <div className="hidden md:block text-right">
//             <p className="text-xs font-bold text-white leading-none mb-1">{user?.fullName}</p>
//             <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Verified Admin</p>
//           </div>
//           {/* <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-[#C9A84C]">
//             <User size={18} />
//           </div> */}
//         </div>
//       </div>
//     </header>
//   );
// }

















import { useEffect, useState } from 'react';
import { Menu, User } from 'lucide-react';
import { ActiveView } from '../App';
import { useAuth } from '../context/AuthContext';

const ACCENT = '#FF8C00';
const MONO   = '"Courier New", Courier, monospace';
const FONT   = 'Georgia, serif';

interface HeaderProps {
  activeView:          ActiveView;
  setIsMobileMenuOpen: (val: boolean) => void;
}

// ─── Self-contained theme hook (reads DOM class, same as public pages) ────────
function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return !document.documentElement.classList.contains('light-mode');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light-mode'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const VIEW_LABELS: Record<ActiveView, string> = {
  dashboard: 'Dashboard Overview',
  posts: 'Content Management',
  categories: 'Category Taxonomy',
  curation: 'Homepage Curation',
  create: 'New Article',
  edit: 'Editor',
  forum: 'Forum Moderation',
  outreach: 'Outreach Management',
  traffic: 'Traffic Management',
  users: 'Users Management'
};

export default function Header({ activeView, setIsMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const isDark   = useTheme();

  const headerBg     = isDark ? 'rgba(10,10,10,0.9)'   : 'rgba(255,255,255,0.92)';
  const borderColor  = isDark ? 'rgba(255,140,0,0.15)' : 'rgba(255,140,0,0.2)';
  const textPrimary  = isDark ? '#FFFFFF'               : '#111111';
  const textMuted    = isDark ? 'rgba(255,255,255,0.45)': 'rgba(0,0,0,0.4)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.08)';
  const avatarBg     = isDark ? '#1A1A1A'               : '#F0F0F0';

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300"
      style={{ backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}` }}
    >
      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg transition-colors md:hidden"
          style={{ color: textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          {/* <div className="w-1 h-5 rounded-full" style={{ backgroundColor: ACCENT }} /> */}
          <h2
            className="text-base font-bold tracking-tight"
            style={{ color: textPrimary, fontFamily: FONT }}
          >
            {VIEW_LABELS[activeView] ?? 'MJ Admin'}
          </h2>
        </div>
      </div>

      {/* Right — user */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden md:block w-px h-6" style={{ backgroundColor: dividerColor }} />

        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarBg, border: `1px solid ${borderColor}` }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
              : <User size={15} style={{ color: ACCENT }} />
            }
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-bold leading-none mb-1" style={{ color: textPrimary, fontFamily: FONT }}>
              {user?.fullName || 'Admin'}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: textMuted, fontFamily: MONO }}>
              Verified Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}