import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  theme?: 'light' | 'vs-dark';
}

export default function DashboardLayout({ children, theme = 'light' }: LayoutProps) {
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
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 transition-colors text-zinc-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <main className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
