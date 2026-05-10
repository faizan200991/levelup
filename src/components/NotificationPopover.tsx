import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, UserPlus, Check, Trash2, FileText, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

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

export default function NotificationPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error("Supabase Notification Error:", error);
          return;
        }

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`notif_sub_${user.id}_${channelId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Real-time notifications active");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createTestNotification = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      actor_id: user.id,
      actor_name: "System Tester",
      actor_avatar: "tester",
      type: 'follow',
      content: "This is a test notification to verify the system is active!"
    });
    if (error) console.error("Test failed:", error);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!notifications.find(n => n.id === id)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare className="w-3 h-3 text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus className="w-3 h-3 text-emerald-500" />;
      case 'submission': return <FileText className="w-3 h-3 text-purple-500 fill-purple-500" />;
      case 'feedback': return <Star className="w-3 h-3 text-orange-500 fill-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all duration-300",
          isOpen ? "bg-zinc-100 text-black shadow-inner" : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
        )}
      >
        <Bell className="w-5 h-5 flex-shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[60]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-zinc-100 shadow-[0_30px_100px_rgba(0,0,0,0.1)] z-[70] overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <Bell className="w-8 h-8 text-zinc-100 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-6">Zero alerts found</p>
                    <button 
                      onClick={createTestNotification}
                      className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                      Send Test Alert
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "p-4 flex gap-3 hover:bg-zinc-50 transition-colors cursor-pointer group relative",
                          !n.read && "bg-blue-50/30"
                        )}
                      >
                        <Link 
                          to={`/profile/${n.actor_id}`}
                          className="shrink-0 relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-100">
                            <img 
                              src={n.actor_avatar && n.actor_avatar.startsWith('http') ? n.actor_avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor_avatar || n.actor_name}`} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-50">
                            {getIcon(n.type)}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-zinc-600">
                            <span className="font-bold text-black uppercase tracking-tight">{n.actor_name}</span>
                            {' '}
                            {n.type === 'like' && 'liked your momentum'}
                            {n.type === 'comment' && `commented: "${n.content}"`}
                            {n.type === 'follow' && 'started following you'}
                            {n.type === 'submission' && `submitted: ${n.content}`}
                            {n.type === 'feedback' && `graded: ${n.content}`}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mt-1.5">{formatTime(n.created_at)}</p>
                        </div>

                        <button 
                          onClick={(e) => deleteNotification(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 h-7 w-7 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all absolute top-2 right-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center">
                  <Link 
                    to="/notifications" 
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    View All Activity
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
