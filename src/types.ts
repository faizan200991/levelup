export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  bio?: string;
  learningPath?: string;
  learningPathSubtitle?: string;
  location?: string;
  locationSubtitle?: string;
  classStatus?: string;
  classStatusSubtitle?: string;
  createdAt: string;
  lastActive?: string;
}

export interface DBClassroom {
  id: string;
  class_name: string;
  teacher_id: string;
  room_code: string;
  created_at: string;
}

export interface ClassRoom {
  id: string;
  className: string;
  teacherId: string;
  roomCode: string;
  createdAt: string;
  language?: string;
  description?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  type: 'exercise' | 'assignment';
  language: string;
  instructionsUrl?: string;
  starterCode?: string;
  sampleInput?: string;
  expectedOutput?: string;
  dueDate?: string | null;
  createdAt: string;
  classroomId?: string;
  className?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhotoURL?: string;
  problemId: string;
  problemTitle?: string;
  language?: string;
  code: string;
  output: string;
  status: 'pending' | 'correct' | 'incorrect';
  feedback?: string;
  submittedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export interface LiveCode {
  id: string; 
  studentId: string;
  studentName: string;
  studentPhotoURL?: string;
  problemId?: string;
  problemTitle?: string;
  code: string;
  language: string;
  lastUpdated: string;
}
