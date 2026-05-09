import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ClassRoom } from '../types';
import { cn } from '../lib/utils';
import Loader from '../components/Loader';
import TeacherClassroom from './TeacherClassroom';
import StudentClassroom from './StudentClassroom';

export default function Classroom() {
  const { classId } = useParams<{ classId: string }>();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'vs-dark'>('vs-dark');
  const navigate = useNavigate();

  useEffect(() => {
    if (!classId) return;

    const fetchClassroom = async () => {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('id', classId)
          .single();
        
        if (error) throw error;

        if (data) {
          setClassroom({
            id: data.id,
            className: data.class_name,
            roomCode: data.room_code,
            teacherId: data.teacher_id,
            createdAt: data.created_at
          } as ClassRoom);
          setLoading(false);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching classroom:', err);
        navigate('/dashboard');
      }
    };

    const classSub = supabase
      .channel(`class_${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms', filter: `id=eq.${classId}` }, () => {
        fetchClassroom();
      })
      .subscribe();

    fetchClassroom();

    return () => {
      classSub.unsubscribe();
    };
  }, [classId, navigate]);

  if (loading) return <Loader fullScreen />;
  if (!classroom || !profile) return null;

  return (
    <div className={cn(
      "min-h-screen overflow-hidden",
      theme === 'light' ? "bg-white" : "bg-zinc-950"
    )}>
      {profile.role === 'teacher' ? (
        <TeacherClassroom classroom={classroom} theme={theme} setTheme={setTheme} />
      ) : (
        <StudentClassroom classroom={classroom} theme={theme} setTheme={setTheme} />
      )}
    </div>
  );
}
