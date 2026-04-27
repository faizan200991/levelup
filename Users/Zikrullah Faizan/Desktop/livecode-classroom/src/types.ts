export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  className: string;
  teacherId: string;
  roomCode: string;
  createdAt: string;
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
  createdAt: string;
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
  id: string; // studentId
  studentName: string;
  studentPhotoURL?: string;
  code: string;
  language: string;
  lastUpdated: string;
}
