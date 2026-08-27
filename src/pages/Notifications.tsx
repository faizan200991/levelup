import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Check, Trash2, Calendar, FileCode, ClipboardCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useCallback } from 'react';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar: string;
  type: 'like' | 'comment' | 'follow' | 'submission' | 'feedback';
  content?: string;
  resource_id?: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter === 'unread') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'submission': return <FileCode className="w-4 h-4 text-amber-500" />;
      case 'feedback': return <ClipboardCheck className="w-4 h-4 text-violet-500" />;
      default: return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <h1 className="font-display text-4xl font-bold text-black tracking-tighter leading-none mb-3 uppercase">
              Your <span className="text-blue-600">Activity.</span>
            </h1>
            <p className="text-zinc-600 text-lg font-medium tracking-tight">Stay updated with classroom mentions, peer interactions, and breakthroughs.</p>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-zinc-50 border border-zinc-100 rounded-2xl shadow-sm">
             <button 
               onClick={() => setFilter('all')}
               className={cn(
                 "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 filter === 'all' ? "bg-zinc-950 text-white shadow-xl" : "text-zinc-500 hover:text-black"
               )}
             >
               All Events
             </button>
             <button 
               onClick={() => setFilter('unread')}
               className={cn(
                 "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 filter === 'unread' ? "bg-zinc-950 text-white shadow-xl" : "text-zinc-500 hover:text-black"
               )}
             >
               Unread Only
             </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-zinc-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-32 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
            <Bell className="w-16 h-16 text-zinc-100 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-zinc-300 uppercase tracking-tighter">Everything is quiet</h3>
            <p className="text-zinc-400 mt-2 font-medium">When something happens, we'll let you know.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "bg-white p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center gap-8 group relative overflow-hidden",
                  !n.read ? "border-blue-100 shadow-[0_20px_60px_rgba(59,130,246,0.05)]" : "border-zinc-100 shadow-sm opacity-80"
                )}
              >
                {!n.read && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />}
                
                <Link to={`/profile/${n.actor_id}`} className="relative shrink-0">
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-zinc-50 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={n.actor_avatar && n.actor_avatar.startsWith('http') ? n.actor_avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor_avatar || n.actor_name}`} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-xl border border-zinc-50">
                    {getIcon(n.type)}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/profile/${n.actor_id}`} className="text-lg font-bold text-black uppercase tracking-tight hover:text-blue-600 transition-colors">
                      {n.actor_name}
                    </Link>
                    <div className="w-1 h-1 rounded-full bg-zinc-200" />
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {formatTime(n.created_at)}
                    </div>
                  </div>
                  <p className="text-zinc-600 text-base leading-relaxed font-medium">
                    {n.type === 'like' && 'Solidified your momentum by liking your post.'}
                    {n.type === 'comment' && `Commented on your breakthrough: "${n.content}"`}
                    {n.type === 'follow' && 'Joined your learning network. You can now track each other\'s progress.'}
                    {n.type === 'submission' && `Submitted an assignment: ${n.content}`}
                    {n.type === 'feedback' && `Reviewed your work: ${n.content}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!n.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-zinc-100"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
