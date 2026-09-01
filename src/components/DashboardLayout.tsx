import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';
import NotificationPopover from './NotificationPopover';

interface LayoutProps {
  children: React.ReactNode;
  theme?: 'light' | 'vs-dark';
  subNav?: {
    parentPath: string;
    items: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void }[];
  };
}

export default function DashboardLayout({ children, theme = 'light', subNav }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row transition-colors duration-500",
      theme === 'light' ? "bg-white text-zinc-950" : "bg-zinc-950 text-zinc-100"
    )}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        theme={theme}
        subNav={subNav}
      />
      
      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden h-16 border-b px-6 flex items-center justify-between sticky top-0 z-30 shrink-0",
        "bg-zinc-950 border-zinc-900"
      )}>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded shadow-sm text-zinc-950">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold tracking-tight text-lg text-white">LEVELUP</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPopover />
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 transition-colors text-zinc-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className={cn(
        "flex-1 transition-all duration-300 relative",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Desktop Top Bar — reserves its own space so it never overlaps page content */}
        <div className="hidden lg:flex items-center justify-end h-14 px-8 border-b border-zinc-100">
          <NotificationPopover />
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
