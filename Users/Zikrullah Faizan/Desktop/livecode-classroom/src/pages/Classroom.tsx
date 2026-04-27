import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { ClassRoom, Problem } from '../types';
import Loader from '../components/Loader';
import TeacherClassroom from './TeacherClassroom';
import StudentClassroom from './StudentClassroom';

export default function Classroom() {
  const { classId } = useParams<{ classId: string }>();
  const { user, profile } = useAuth();
  const [classroom, setClassroom] = useState<ClassRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!classId) return;

    const unsub = onSnapshot(doc(db, 'classes', classId), (docSnap) => {
      if (docSnap.exists()) {
        setClassroom({ id: docSnap.id, ...docSnap.data() } as ClassRoom);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    });

    return () => unsub();
  }, [classId]);

  if (loading) return <Loader fullScreen />;
  if (!classroom || !profile) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {profile.role === 'teacher' ? (
        <TeacherClassroom classroom={classroom} />
      ) : (
        <StudentClassroom classroom={classroom} />
      )}
    </div>
  );
}
