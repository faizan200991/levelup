/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyClassrooms from './pages/MyClassrooms';
import Classroom from './pages/Classroom';
import CreateClassroom from './pages/CreateClassroom';
import ProfilePage from './pages/ProfilePage';
import AITutor from './pages/AITutor';
import Loader from './components/Loader';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/classrooms" 
          element={user ? <MyClassrooms /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/classroom/create" 
          element={user && profile?.role === 'teacher' ? <CreateClassroom /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/classroom/:classId" 
          element={user ? <Classroom /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/ai-tutor" 
          element={user ? <AITutor /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile/:uid" 
          element={user ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
