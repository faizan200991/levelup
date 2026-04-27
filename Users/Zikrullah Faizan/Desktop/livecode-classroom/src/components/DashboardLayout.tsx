import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded shadow-sm">
            <Code2 className="w-5 h-5 text-zinc-900" />
          </div>
          <span className="font-display font-bold text-white tracking-tight text-lg">LEVELUP</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white"
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
