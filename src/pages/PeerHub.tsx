import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  Image as ImageIcon,
  User as UserIcon,
  Trash2,
  UserPlus,
  ArrowLeft,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from '../components/Button';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

interface PostRecord {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  likes_count: number;
  has_image: boolean;
  image_url?: string;
  created_at: string;
}

interface CommentRecord {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface PeerProfile {
  id: string;
  name: string;
  photo_url: string;
  role: string;
  is_following?: boolean;
}

export default function PeerHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover'>('feed');
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [users, setUsers] = useState<PeerProfile[]>([]);
  const [comments, setComments] = useState<Record<string, CommentRecord[]>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch comments for all visible posts
      if (postsData && postsData.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .in('post_id', postsData.map(p => p.id));

        if (commentsError) throw commentsError;
        
        const commMap: Record<string, CommentRecord[]> = {};
        commentsData?.forEach(c => {
          if (!commMap[c.post_id]) commMap[c.post_id] = [];
          commMap[c.post_id].push(c);
        });
        setComments(commMap);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      if (activeTab === 'feed') setLoading(false);
    }
  }, [activeTab]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, photo_url, role')
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;

      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingSet = new Set(follows?.map(f => f.following_id) || []);
      setFollowingIds(followingSet);
      
      setUsers(profiles?.map(p => ({
        ...p,
        is_following: followingSet.has(p.id)
      })) || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (data) {
      setUserLikes(new Set(data.map(l => l.post_id)));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'feed') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPosts();
      if (user) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUserLikes();
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
  }, [user, activeTab, fetchPosts, fetchUsers, fetchUserLikes]);

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(targetId);

    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetId });
        followingIds.delete(targetId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
        followingIds.add(targetId);
        
        // Notification for follow
        const { data: profile } = await supabase.from('profiles').select('name, photo_url').eq('id', user.id).single();
        await supabase.from('notifications').insert({
          user_id: targetId,
          actor_id: user.id,
          actor_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
          actor_avatar: profile?.photo_url || user.id,
          type: 'follow'
        });
      }
      setFollowingIds(new Set(followingIds));
      setUsers(users.map(u => u.id === targetId ? { ...u, is_following: !isFollowing } : u));
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    
    try {
      setUploading(true);
      let uploadedImageUrl = '';
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, imageFile);

        if (uploadError) {
          if (uploadError.message === 'Bucket not found') {
            throw new Error('Supabase Storage bucket "materials" not found. Please create it in your Supabase dashboard and set it to public.');
          }
          if (uploadError.message.includes('row-level security policy')) {
            throw new Error('Supabase Storage RLS Policy Error: You need to add policies to allow uploads to the "materials" bucket. See supabase_schema.sql for the required SQL.');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);
        
        uploadedImageUrl = publicUrl;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, photo_url')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          author_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
          author_avatar: profile?.photo_url || (Number(user.id.charCodeAt(0) % 50)).toString(),
          content: newPost,
          likes_count: 0,
          has_image: !!uploadedImageUrl,
          image_url: uploadedImageUrl || null
        })
        .select()
        .single();

      if (error) throw error;
      setPosts([data, ...posts]);
      setNewPost('');
      removeImage();
    } catch (err) {
      console.error('Failed to post:', err);
      alert('Failed to post to Hub. Make sure the "materials" bucket exists in your Supabase storage and has public access.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    if (!user) return;
    const isLiked = userLikes.has(postId);
    
    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
        await supabase.from('posts').update({ likes_count: Math.max(0, currentLikes - 1) }).eq('id', postId);
        userLikes.delete(postId);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
        userLikes.add(postId);

        // Notification for like
        const post = posts.find(p => p.id === postId);
        if (post && post.author_id !== user.id) {
          const { data: profile } = await supabase.from('profiles').select('name, photo_url').eq('id', user.id).single();
          await supabase.from('notifications').insert({
            user_id: post.author_id,
            actor_id: user.id,
            actor_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
            actor_avatar: profile?.photo_url || user.id,
            type: 'like',
            resource_id: postId
          });
        }
      }
      setUserLikes(new Set(userLikes));
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1 } : p));
    } catch (err) {
      console.error('Like action failed:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim() || !user) return;

    try {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
      const { data, error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        author_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
        content: content,
      }).select().single();

      if (error) throw error;

      // Notification for comment
      const post = posts.find(p => p.id === postId);
      if (post && post.author_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.author_id,
          actor_id: user.id,
          actor_name: profile?.name || user.email?.split('@')[0] || 'Anonymous',
          actor_avatar: user.id, 
          type: 'comment',
          content: content.length > 30 ? content.substring(0, 27) + '...' : content,
          resource_id: postId
        });
      }

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-3 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-black tracking-tighter leading-none mb-1.5 uppercase">
                Peer <span className="text-blue-600">Hub.</span>
              </h1>
              <p className="text-zinc-600 text-sm font-medium tracking-tight">
                {activeTab === 'feed' 
                  ? "Discuss, share breakthroughs, and learn together with fellow students."
                  : "Find and connect with fellow learners across the globe."}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button 
                onClick={() => setActiveTab(activeTab === 'feed' ? 'discover' : 'feed')}
                className={cn(
                  "p-3 rounded-xl border flex items-center gap-2.5 transition-all",
                  activeTab === 'discover' 
                    ? "bg-zinc-950 text-white border-zinc-900 shadow-md" 
                    : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                )}
              >
                {activeTab === 'feed' ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <div className="text-[9px] font-black uppercase tracking-wider text-left">
                      Connect Peers
                    </div>
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    <div className="text-[9px] font-black uppercase tracking-wider">
                      Back To Feed
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'feed' ? (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                {/* Create Post */}
                <div className="bg-white p-4.5 rounded-2xl border border-zinc-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 group-focus-within:h-1.5 transition-all" />
                  <textarea 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Ask a question or share a breakthrough..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-zinc-400 resize-none min-h-[75px] font-medium"
                  />
                  
                  {previewUrl && (
                    <div className="relative mt-2 mb-3 group/preview">
                      <div className="aspect-video rounded-xl overflow-hidden border border-zinc-100 shadow-md">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button 
                        onClick={removeImage}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-red-500 hover:scale-110 transition-all opacity-0 group-hover/preview:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-50">
                    <div className="flex gap-3">
                       <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-black transition-all cursor-pointer">
                         <ImageIcon className="w-3.5 h-3.5" />
                         <span className="text-[9px] font-black uppercase tracking-wider">Share Photo</span>
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleFileSelect}
                         />
                       </label>
                    </div>
                    <Button 
                      size="md" 
                      onClick={handlePost}
                      disabled={(!newPost.trim() && !imageFile) || !user || uploading}
                      className={cn(
                        "rounded-lg h-9 px-4 text-[10px] font-black uppercase tracking-wider transition-all",
                        (!newPost.trim() && !imageFile) || !user || uploading
                          ? "bg-zinc-950 text-zinc-500 cursor-not-allowed shadow-none opacity-80"
                          : "bg-blue-600 hover:bg-blue-700 shadow-md text-white"
                      )}
                    >
                      {uploading ? 'Sharing...' : 'Share'} <Send className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Hub Feed */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4 mb-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">THE_LATEST_FEED</span>
                     <div className="flex-1 h-px bg-zinc-100" />
                     <button 
                      onClick={fetchPosts}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                     >
                       Refresh
                     </button>
                   </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-10 h-10 border-4 border-zinc-100 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                      <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                      <p className="text-zinc-500 font-medium">No posts in the Hub yet. Be the first!</p>
                    </div>
                  ) : (
                    posts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.05)] hover:border-zinc-200 transition-all duration-500"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <Link to={`/profile/${post.author_id}`} className="flex items-center gap-4 group/author">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-zinc-50 shadow-sm relative shrink-0">
                               {post.author_avatar && post.author_avatar.startsWith('http') ? (
                                 <img src={post.author_avatar} alt="" className="w-full h-full object-cover group-hover/author:scale-110 transition-transform duration-500" />
                               ) : (
                                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_avatar || post.author_name}`} alt="" className="w-full h-full object-cover group-hover/author:scale-110 transition-transform duration-500" />
                               )}
                               <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/author:opacity-100 transition-opacity" />
                            </div>
                            <div>
                               <h3 className="text-base font-bold tracking-tight text-black group-hover/author:text-blue-600 transition-colors uppercase">{post.author_name}</h3>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                 <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{formatTimestamp(post.created_at)}</p>
                               </div>
                            </div>
                          </Link>
                          <div className="flex items-center gap-1.5">
                            {user?.id === post.author_id && (
                              <button 
                                onClick={() => handleDelete(post.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                            <Link to={`/profile/${post.author_id}`}>
                              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                <UserIcon className="w-4.5 h-4.5" />
                              </button>
                            </Link>
                          </div>
                        </div>
                        
                        <p className="text-base leading-relaxed text-zinc-800 mb-6 font-medium">
                          {post.content}
                        </p>
                        
                        {post.has_image && post.image_url && (
                          <div className="aspect-video rounded-[1.5rem] overflow-hidden border border-zinc-100 mb-6 group relative bg-zinc-50 cursor-pointer">
                            <img 
                              src={post.image_url} 
                              alt="Post media" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-all duration-500" />
                          </div>
                        )}

                        <div className="flex items-center gap-6 pt-6 border-t border-zinc-50">
                           <button 
                             onClick={() => handleLike(post.id, post.likes_count)}
                             className="flex items-center gap-2.5 group px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all"
                           >
                             <ThumbsUp className={cn(
                              "w-4.5 h-4.5 transition-all", 
                              userLikes.has(post.id) ? "text-blue-600 fill-blue-600 scale-110" : "text-zinc-400 group-hover:text-black"
                             )} />
                             <span className="text-xs font-black text-black">{post.likes_count}</span>
                           </button>
                           
                           <button className="flex items-center gap-2.5 group px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all">
                             <MessageSquare className="w-4.5 h-4.5 text-zinc-400 group-hover:text-black" />
                             <span className="text-xs font-black text-black">{comments[post.id]?.length || 0}</span>
                           </button>
                        </div>

                        <AnimatePresence>
                          <div className="mt-6 pt-6 border-t border-zinc-50 space-y-5">
                            <div className="flex gap-3">
                              <div className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input 
                                  value={commentInputs[post.id] || ''}
                                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                  placeholder="Add a comment..."
                                  className="flex-1 bg-zinc-50 border-none focus:ring-0 text-xs py-1.5 px-3 rounded-lg placeholder:text-zinc-400 font-medium"
                                />
                                <button 
                                  onClick={() => handleComment(post.id)}
                                  disabled={!commentInputs[post.id]?.trim()}
                                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {comments[post.id] && comments[post.id].length > 0 && (
                              <div className="space-y-4">
                                {comments[post.id].map((comment, cIdx) => (
                                  <div key={cIdx} className="flex gap-3">
                                     <div className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                                       <Users className="w-3.5 h-3.5 text-blue-400" />
                                     </div>
                                     <div>
                                       <p className="text-xs leading-relaxed">
                                         <Link to={`/profile/${comment.author_id}`} className="font-bold text-black mr-2 uppercase tracking-tight hover:text-blue-600 transition-colors">{comment.author_name}</Link>
                                         <span className="text-zinc-600 font-medium">{comment.content}</span>
                                       </p>
                                       <p className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mt-1.5">{formatTimestamp(comment.created_at)}</p>
                                     </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Search Peers */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="w-6 h-6 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search peers by name or role..."
                    className="w-full bg-white py-6 pl-16 pr-8 rounded-[2rem] border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/20 text-lg transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 animate-pulse h-32" />
                    ))
                  ) : users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="md:col-span-2 text-center py-20 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200">
                      <UserPlus className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                      <p className="text-zinc-500 font-medium">No peers found matching your search.</p>
                    </div>
                  ) : (
                    users
                      .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((peer, idx) => (
                        <motion.div
                          key={peer.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex items-center gap-5 group hover:shadow-xl hover:border-zinc-200 transition-all duration-500"
                        >
                          <Link to={`/profile/${peer.id}`} className="relative shrink-0">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-zinc-50 shadow-sm relative">
                              <img 
                                src={peer.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.id}`} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full" />
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${peer.id}`}>
                              <h3 className="font-bold text-black text-lg truncate hover:text-blue-600 transition-colors uppercase tracking-tight">
                                {peer.name}
                              </h3>
                            </Link>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                              {peer.role}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                               <button 
                                onClick={() => handleFollow(peer.id)}
                                className={cn(
                                 "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                 peer.is_following
                                   ? "bg-zinc-100 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                                   : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                                )}
                               >
                                 {peer.is_following ? 'Unfollow' : 'Connect'}
                               </button>
                               <Link to={`/profile/${peer.id}`} className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-white transition-all">
                                 <UserIcon className="w-4 h-4" />
                               </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'feed' && (
            <div className="bg-zinc-950 p-12 rounded-[4rem] text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Grow the Learning Community</h3>
              <p className="text-zinc-400 max-w-sm mx-auto text-sm font-medium leading-relaxed mb-8">The more we share our progress, the more we grow. Help your peers today and climb the leaderboard!</p>
              <Button 
                  onClick={() => setActiveTab('discover')}
                  className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[10px] shadow-2xl"
                >
                  Find Peers
                </Button>
              </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
