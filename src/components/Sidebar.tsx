import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  LogOut, 
  Code2,
  ChevronRight,
  MessageSquare,
  User,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'light' | 'vs-dark';
  subNav?: {
    parentPath: string;
    items: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void }[];
  };
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, subNav }: SidebarProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'My Classrooms', path: '/classrooms' },
    { icon: Users, label: 'Peer Hub', path: '/peer-hub' },
    { icon: MessageSquare, label: 'AI Tutor', path: '/ai-tutor' },
    { icon: User, label: 'My Profile', path: `/profile/${user?.id}` },
  ];

  if (profile?.role === 'teacher') {
    navItems.push({ icon: PlusCircle, label: 'Create Class', path: '/classroom/create' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen border-r flex flex-col z-50 transition-all duration-300 transform lg:translate-x-0 leading-relaxed overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "lg:w-20" : "lg:w-64",
        "bg-zinc-950 border-zinc-900"
      )}>
        {/* Brand */}
        <div className={cn(
          "p-3 flex items-center shrink-0 px-4",
          isCollapsed ? "justify-center p-3" : "justify-between"
        )}>
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg shrink-0 bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Code2 className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-base tracking-tighter uppercase transition-all duration-300 text-white">LEVELUP</span>
            )}
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-zinc-500 hover:text-white">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5 mt-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <div key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-1 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-zinc-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-zinc-800" 
                  : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-200",
                isCollapsed && "justify-center px-0"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive && "text-white")} />
                  {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                  {!isCollapsed && <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                  {isCollapsed && (
                    <div className="absolute left-full ml-6 px-3 py-2 text-[10px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap uppercase tracking-[0.2em] font-black border shadow-2xl bg-zinc-900 text-white border-zinc-800">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>

            {/* Page-specific sub-navigation — e.g. the active classroom's
                Live Feed / Heatmap / Curriculum / Review / Materials tabs,
                nested under "My Classrooms" instead of a horizontal bar
                that overflows on narrower screens. */}
            {subNav && subNav.parentPath === item.path && !isCollapsed && (
              <div className="ml-4 pl-3 border-l border-zinc-900 space-y-0.5 mt-0.5 mb-1">
                {subNav.items.map((sub) => (
                  <button
                    key={sub.label}
                    onClick={sub.onClick}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1 rounded-lg transition-all text-left",
                      sub.active
                        ? "bg-blue-600/15 text-blue-400"
                        : "text-zinc-600 hover:bg-zinc-900/40 hover:text-zinc-300"
                    )}
                  >
                    <sub.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold tracking-tight">{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-2.5 border-t space-y-0.5 border-zinc-900">
        {!isCollapsed && (
          <Link to={`/profile/${user?.id}`} className="block">
            <div className="px-2 py-1 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer group bg-zinc-900/50 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800">
              <div className="w-7 h-7 rounded-xl overflow-hidden border shrink-0 group-hover:scale-105 transition-transform border-zinc-800">
                 <img 
                   src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                   alt="User" 
                   className="w-full h-full object-cover"
                   referrerPolicy="no-referrer"
                 />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate tracking-tight transition-colors text-white group-hover:text-blue-400">{profile?.name || user?.user_metadata?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-1 h-1 rounded-full animate-pulse", profile?.role === 'teacher' ? "bg-amber-500" : "bg-blue-500")} />
                  <p className="text-[8px] uppercase font-black tracking-widest leading-none text-zinc-500">{profile?.role}</p>
                </div>
              </div>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link to={`/profile/${user?.id}`} className="flex justify-center mb-0.5">
             <div className="w-7 h-7 rounded-lg overflow-hidden border transition-all cursor-pointer border-zinc-800 hover:border-blue-500">
               <img 
                 src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                 alt="User" 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
            </div>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-1 rounded-xl transition-all font-bold group relative",
            isCollapsed && "justify-center px-0",
            "text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
          )}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span className="text-[11px]">Sign Out</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "hidden lg:flex items-center gap-3 w-full px-3 py-1 rounded-xl transition-all font-medium",
            isCollapsed && "justify-center px-0",
            "text-zinc-600 hover:text-white"
          )}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isCollapsed ? "rotate-0" : "rotate-180")} />
          {!isCollapsed && <span className="text-[11px]">Collapse</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
