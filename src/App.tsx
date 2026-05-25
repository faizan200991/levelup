/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
import PeerHub from './pages/PeerHub';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Loader from './components/Loader';

function AnimatedRoutes() {
  const location = useLocation();
  const { user, profile } = useAuth();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
          />
          <Route 
            path="/forgot-password" 
            element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password" 
            element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} 
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
            path="/peer-hub" 
            element={user ? <PeerHub /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile/:uid" 
            element={user ? <ProfilePage /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/notifications" 
            element={user ? <Notifications /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
