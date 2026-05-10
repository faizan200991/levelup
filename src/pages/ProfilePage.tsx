import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User, Mail, Shield, Calendar, Edit3, Camera, MapPin, Code2, ArrowLeft, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

import DashboardLayout from '../components/DashboardLayout';

export default function ProfilePage() {
  const { uid } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState('');
  const [learningPathSubtitle, setLearningPathSubtitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationSubtitle, setLocationSubtitle] = useState('');
  const [classStatus, setClassStatus] = useState('');
  const [classStatusSubtitle, setClassStatusSubtitle] = useState('');
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isOwnProfile = user?.id === uid;

  useEffect(() => {
    async function fetchProfile() {
      if (!uid) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
        
        if (data) {
          const profileData: UserProfile = {
            uid: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            photoURL: data.photo_url,
            bio: data.bio,
            learningPath: data.learning_path,
            learningPathSubtitle: data.learning_path_subtitle,
            location: data.location,
            locationSubtitle: data.location_subtitle,
            classStatus: data.class_status,
            classStatusSubtitle: data.class_status_subtitle,
            createdAt: data.created_at,
            lastActive: data.last_active
          };
          setProfile(profileData);
          setName(data.name);
          setBio(data.bio || '');
          setPhotoURL(data.photo_url || null);
          setLearningPath(data.learning_path || '');
          setLearningPathSubtitle(data.learning_path_subtitle || '');
          setLocation(data.location || '');
          setLocationSubtitle(data.location_subtitle || '');
          setClassStatus(data.class_status || '');
          setClassStatusSubtitle(data.class_status_subtitle || '');
          setXp(data.xp || 0);
          setLevel(data.level || 1);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    async function fetchFollowStats() {
      if (!uid) return;
      const [followers, following, relationship] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', uid),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', uid),
        user ? supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', uid).single() : Promise.resolve({ data: null })
      ]);
      setFollowerCount(followers.count || 0);
      setFollowingCount(following.count || 0);
      setIsFollowing(!!relationship.data);
    }
    fetchProfile();
    fetchFollowStats();
  }, [uid, user]);

  const handleFollow = async () => {
    if (!user || !uid || isOwnProfile) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: uid });
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: uid });
        setFollowerCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        setUpdating(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

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

        setPhotoURL(publicUrl);
        // Also update the DB immediately if not in full edit mode? 
        // No, let's wait for Save Changes to keep it consistent with the existing UI logic.
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to upload photo');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!user || !uid) return;
    setUpdating(true);
    try {
      const updateData = {
        name,
        bio,
        photo_url: photoURL,
        learning_path: learningPath,
        learning_path_subtitle: learningPathSubtitle,
        location,
        location_subtitle: locationSubtitle,
        class_status: classStatus,
        class_status_subtitle: classStatusSubtitle,
        last_active: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', uid);
      
      if (error) throw error;
      
      setProfile({ 
        ...profile!, 
        name, 
        bio, 
        photoURL, 
        learningPath, 
        learningPathSubtitle, 
        location, 
        locationSubtitle, 
        classStatus, 
        classStatusSubtitle 
      });
      setEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-zinc-100 max-w-md">
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <User className="w-10 h-10 text-zinc-200" />
          </div>
          <h2 className="text-3xl font-display font-bold text-black tracking-tight">{error || 'Profile not found'}</h2>
          <Button 
            variant="outline" 
            className="mt-8 h-14 px-10 rounded-2xl border-zinc-200 text-black font-bold shadow-sm hover:bg-zinc-50"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Action Area */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="h-12 px-6 rounded-2xl flex items-center gap-3 text-zinc-500 hover:text-zinc-950 hover:bg-white transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Protocol</span>
          </Button>
          
          <Link to="/dashboard">
            <Button 
              variant="ghost" 
              className="h-12 px-6 rounded-2xl flex items-center gap-3 text-zinc-500 hover:text-zinc-950 hover:bg-white transition-all group"
            >
              <Code2 className="w-5 h-5" /> 
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Command Center</span>
            </Button>
          </Link>
        </div>

        {/* Header/Cover Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-white overflow-hidden"
        >
          <div className="h-48 md:h-64 bg-zinc-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10" />
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-20 blur-[100px] pointer-events-none">
                  <div className="w-[800px] h-[800px] bg-blue-600 rounded-full animate-pulse absolute top-0 left-0" />
                  <div className="w-[600px] h-[600px] bg-emerald-500 rounded-full animate-pulse absolute bottom-0 right-0 delay-1000" />
               </div>
            </div>
            
            {isOwnProfile && (
              <div className="absolute top-8 right-8 z-20">
                {!editing ? (
                  <Button 
                    className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20 h-14 px-8 rounded-2xl flex items-center gap-3 transition-all font-bold"
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 className="w-5 h-5" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="bg-zinc-950/40 border-white/20 text-white hover:bg-zinc-950/60 h-14 px-8 rounded-2xl font-bold"
                      onClick={() => {
                        setEditing(false);
                        setName(profile.name);
                        setBio(profile.bio || '');
                        setPhotoURL(profile.photoURL || null);
                        setLearningPath(profile.learningPath || '');
                        setLearningPathSubtitle(profile.learningPathSubtitle || '');
                        setLocation(profile.location || '');
                        setLocationSubtitle(profile.locationSubtitle || '');
                        setClassStatus(profile.classStatus || '');
                        setClassStatusSubtitle(profile.classStatusSubtitle || '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 rounded-2xl font-bold shadow-xl shadow-blue-900/20"
                      onClick={handleUpdate}
                      isLoading={updating}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="px-8 md:px-16 pb-16 relative">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 -mt-20 md:-mt-24">
              {/* Profile Photo */}
              <div className="relative group shrink-0">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] bg-zinc-50 border-8 border-white shadow-2xl overflow-hidden relative">
                  {photoURL ? (
                    <img src={photoURL} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                      <User className="w-16 h-16 text-zinc-300" />
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {editing && (
                      <motion.label 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-[2px] transition-all hover:bg-black/60"
                      >
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>
                {/* Active Indicator */}
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 pt-4 md:pt-28">
                <AnimatePresence mode="wait">
                  {!editing ? (
                    <motion.div 
                      key="view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div>
                        <h1 className="text-4xl md:text-5xl font-display font-black text-black tracking-tight leading-none mb-4 uppercase">
                          {profile.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6">
                          <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                            profile.role === 'teacher' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            <Shield className="w-3.5 h-3.5 inline mr-2" /> {profile.role}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                            <Mail className="w-4 h-4" /> {profile.email}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                            <Calendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                          </div>
                          <div className={cn(
                            "flex items-center gap-4 px-4 py-1.5 rounded-2xl border transition-all",
                            profile.role === 'teacher' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-orange-50 border-orange-100 text-orange-600 shadow-sm"
                          )}>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">LEVEL {level}</span>
                              <div className="w-20 h-1 rounded-full bg-black/10 overflow-hidden mt-1">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(xp / 1500) * 100}%` }}
                                  className={cn("h-full shadow-[0_0_10px_rgba(59,130,246,0.3)]", profile.role === 'teacher' ? "bg-blue-500" : "bg-orange-500")}
                                />
                              </div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner",
                              profile.role === 'teacher' ? "bg-white border-blue-200" : "bg-white border-orange-200"
                            )}>
                              <Flame className={cn("w-4 h-4", profile.role === 'teacher' ? "text-blue-500" : "text-orange-500")} />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500 pt-2 md:pt-0">
                            <div className="flex flex-col">
                              <span className="text-black text-lg">{followingCount}</span>
                              <span className="text-[8px] opacity-60">Following</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100" />
                            <div className="flex flex-col">
                              <span className="text-black text-lg">{followerCount}</span>
                              <span className="text-[8px] opacity-60">Followers</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!isOwnProfile && (
                        <div className="pt-4">
                          <Button 
                            onClick={handleFollow}
                            className={cn(
                              "h-12 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                              isFollowing 
                                ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200" 
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100"
                            )}
                          >
                            {isFollowing ? 'Following' : '+ Follow Peer'}
                          </Button>
                        </div>
                      )}
                      
                      <div className="pt-8 border-t border-zinc-50">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Biography</p>
                        <p className="text-xl text-black font-medium leading-relaxed max-w-3xl italic">
                          {profile.bio || "This user is focused on excellence in coding."}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input 
                          label="Profile Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="rounded-2xl h-14 text-xl font-bold bg-zinc-50 border-zinc-100"
                        />
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Learning Path</label>
                           <input 
                             value={learningPath}
                             onChange={(e) => setLearningPath(e.target.value)}
                             className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-black"
                             placeholder="e.g. Software Engineer"
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Learning Details</label>
                          <input 
                            value={learningPathSubtitle}
                            onChange={(e) => setLearningPathSubtitle(e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-black"
                            placeholder="e.g. Mastering Web Development"
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Location</label>
                           <input 
                             value={location}
                             onChange={(e) => setLocation(e.target.value)}
                             className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-black"
                             placeholder="e.g. London, UK"
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Location Description</label>
                          <input 
                            value={locationSubtitle}
                            onChange={(e) => setLocationSubtitle(e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-black"
                            placeholder="e.g. Remote Student"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Class Status</label>
                          <input 
                            value={classStatus}
                            onChange={(e) => setClassStatus(e.target.value)}
                            className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-black"
                            placeholder="e.g. Active Learner"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Status Description</label>
                        <input 
                          value={classStatusSubtitle}
                          onChange={(e) => setClassStatusSubtitle(e.target.value)}
                          className="w-full h-14 px-6 rounded-2xl bg-zinc-50 border border-zinc-100 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium text-black"
                          placeholder="e.g. Involved in 5 coding projects"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Profile Bio</label>
                        <textarea 
                          className="w-full min-h-[160px] p-6 rounded-3xl bg-zinc-50 border border-zinc-100 text-lg font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                          placeholder="Tell us about yourself, your goals, or your coding philosophy..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Statistics or Tags Section (Optional Branding) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ProfileStatCard 
             icon={<Code2 className="w-6 h-6" />}
             label="Learning Path"
             value={profile.learningPath || "Not Specified"}
             description={profile.learningPathSubtitle || "Add your path in settings"}
           />
           <ProfileStatCard 
             icon={<MapPin className="w-6 h-6" />}
             label="Location"
             value={profile.location || "Not Specified"}
             description={profile.locationSubtitle || "Add your location in settings"}
           />
           <ProfileStatCard 
             icon={<Calendar className="w-6 h-6" />}
             label="Class Status"
             value={profile.classStatus || "Not Specified"}
             description={profile.classStatusSubtitle || "Update your status in settings"}
           />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileStatCard({ icon, label, value, description }: { icon: React.ReactNode, label: string, value: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white p-10 rounded-[3rem] shadow-xl border border-white group"
    >
      <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8 border border-zinc-100 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      <h3 className="text-2xl font-display font-bold text-black tracking-tight mb-3 uppercase">{value}</h3>
      <p className="text-zinc-500 font-medium text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
