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
  const [classroomCount, setClassroomCount] = useState(0);
  const [totalStudentCount, setTotalStudentCount] = useState(0);
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
    async function fetchTeacherStats() {
      if (!uid) return;
      const { data: classrooms, count } = await supabase
        .from('classrooms')
        .select('id', { count: 'exact' })
        .eq('teacher_id', uid);
      setClassroomCount(count || 0);
      const classroomIds = (classrooms || []).map((c) => c.id);
      if (classroomIds.length > 0) {
        const { count: studentCount } = await supabase
          .from('enrollments')
          .select('student_id', { count: 'exact', head: true })
          .in('classroom_id', classroomIds);
        setTotalStudentCount(studentCount || 0);
      } else {
        setTotalStudentCount(0);
      }
    }
    fetchProfile();
    fetchFollowStats();
    fetchTeacherStats();
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
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Navigation Action Area */}
        <div className="flex items-center justify-between -mt-1">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="h-8 px-3 rounded-xl flex items-center gap-2 text-zinc-500 hover:text-zinc-950 hover:bg-white transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Go Back</span>
          </Button>
          
          <Link to="/dashboard">
            <Button 
              variant="ghost" 
              className="h-8 px-3 rounded-xl flex items-center gap-2 text-zinc-500 hover:text-zinc-950 hover:bg-white transition-all group"
            >
              <Code2 className="w-3.5 h-3.5" /> 
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Header/Cover Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-white overflow-hidden"
        >
          <div className="h-20 md:h-24 bg-zinc-950 relative overflow-hidden">
            <div className={cn("absolute inset-0", profile.role === 'teacher' ? "bg-blue-600/10" : "bg-emerald-500/10")} />
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[80px] opacity-30 pointer-events-none"
                 style={{ backgroundColor: profile.role === 'teacher' ? '#2563EB' : '#10B981' }} />
            
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-20">
                {!editing ? (
                  <Button 
                    className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20 h-10 px-5 rounded-xl flex items-center gap-2 transition-all font-bold text-xs"
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2.5">
                    <Button 
                      variant="outline"
                      className="bg-zinc-950/40 border-white/20 text-white hover:bg-zinc-950/60 h-10 px-5 rounded-xl font-bold text-xs"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-5 rounded-xl font-bold text-xs shadow-md shadow-blue-900/20"
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
          
          <div className="px-6 md:px-8 pb-6 relative">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 -mt-8 md:-mt-10">
              {/* Profile Photo */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-50 border-4 border-white shadow-xl overflow-hidden relative">
                  {photoURL ? (
                    <img src={photoURL} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                      <User className="w-9 h-9 text-zinc-300" />
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
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Update</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>
                {/* Active Indicator */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full shadow-lg" />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 pt-1 md:pt-11 w-full">
                <AnimatePresence mode="wait">
                  {!editing ? (
                    <motion.div 
                      key="view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                            <h1 className="text-2xl md:text-3xl font-display font-black text-black tracking-tight leading-none">
                              {profile.name}
                            </h1>
                            <div className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                              profile.role === 'teacher' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              <Shield className="w-3 h-3 inline mr-1 -mt-0.5" /> {profile.role}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-400 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200 hidden sm:block" />
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Compact stat + level cluster */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-3">
                            {profile.role === 'teacher' ? (
                              <>
                                <StatPip value={classroomCount} label="Classrooms" />
                                <StatPip value={totalStudentCount} label="Students" />
                              </>
                            ) : (
                              <>
                                <StatPip value={followingCount} label="Following" />
                                <StatPip value={followerCount} label="Followers" />
                              </>
                            )}
                          </div>
                          <div className="w-px h-7 bg-zinc-100" />
                          <div className={cn(
                            "flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl",
                            profile.role === 'teacher' ? "bg-blue-50/60" : "bg-orange-50/60"
                          )}>
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center bg-white shadow-sm shrink-0",
                            )}>
                              <Flame className={cn("w-3.5 h-3.5", profile.role === 'teacher' ? "text-blue-500" : "text-orange-500")} />
                            </div>
                            <div>
                              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-500 block leading-tight">Level {level}</span>
                              <div className="w-14 h-1 rounded-full bg-black/10 overflow-hidden mt-1">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(xp / 1500) * 100}%` }}
                                  className={cn("h-full", profile.role === 'teacher' ? "bg-blue-500" : "bg-orange-500")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!isOwnProfile && (
                        <div className="pt-1">
                          <Button 
                            onClick={handleFollow}
                            className={cn(
                              "h-9 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all",
                              isFollowing 
                                ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200" 
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                            )}
                          >
                            {isFollowing ? 'Following' : '+ Follow Peer'}
                          </Button>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-zinc-50">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Biography</p>
                        <p className="text-sm text-zinc-700 font-medium leading-relaxed max-w-2xl line-clamp-2">
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
        
        {/* Compact info strip — replaces the old oversized 3-card layout */}
        <div className="bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
           <ProfileInfoItem 
             icon={<Code2 className="w-4 h-4" />}
             label="Learning Path"
             value={profile.learningPath || "Not specified"}
             description={profile.learningPathSubtitle || "Add your path in settings"}
           />
           <ProfileInfoItem 
             icon={<MapPin className="w-4 h-4" />}
             label="Location"
             value={profile.location || "Not specified"}
             description={profile.locationSubtitle || "Add your location in settings"}
           />
           <ProfileInfoItem 
             icon={<Calendar className="w-4 h-4" />}
             label="Class Status"
             value={profile.classStatus || "Not specified"}
             description={profile.classStatusSubtitle || "Update your status in settings"}
           />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatPip({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-black text-lg font-display font-black leading-none">{value}</span>
      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">{label}</span>
    </div>
  );
}

function ProfileInfoItem({ icon, label, value, description }: { icon: React.ReactNode, label: string, value: string, description: string }) {
  return (
    <div className="p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 border border-zinc-100 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
        <h3 className="text-sm font-bold text-zinc-950 tracking-tight truncate">{value}</h3>
        <p className="text-zinc-400 font-medium text-xs mt-0.5 truncate">{description}</p>
      </div>
    </div>
  );
}
