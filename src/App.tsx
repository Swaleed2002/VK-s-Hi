import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCallStore } from './store/useCallStore';
import { Splash } from './pages/Splash';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AppLayout } from './components/layout/AppLayout';
import { Chats } from './pages/Chats';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Contacts } from './pages/Contacts';
import { Calls } from './pages/Calls';
import { CallScreen } from './components/call/CallScreen';
import { setupPushNotifications } from './lib/pushNotifications';

function PushRouter() {
  const navigate = useNavigate();
  useEffect(() => {
    const handlePushNavigate = (e: any) => {
      if (e.detail) {
        navigate(e.detail);
      }
    };
    window.addEventListener('pushNavigate', handlePushNavigate);
    return () => window.removeEventListener('pushNavigate', handlePushNavigate);
  }, [navigate]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuthStore();
  const initCalls = useCallStore(state => state.initializeListener);
  
  useEffect(() => {
    if (user && profile) {
      initCalls();
      setupPushNotifications();
    }
  }, [user, profile, initCalls]);
  
  if (loading) return <Splash />;
  
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <PushRouter />
      {children}
    </>
  );
}

export default function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <CallScreen />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/chats" replace />} />
          <Route path="chats" element={<Chats />}> 
            <Route path=":id" element={<Chat />} />
          </Route>
          <Route path="calls" element={<Calls />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Profile is out of AppLayout so it doesn't show bottom tabs */}
        <Route path="/profile" element={
          <ProtectedRoute>
             <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/profile/:id" element={
          <ProtectedRoute>
             <Profile />
          </ProtectedRoute>
        } />
        
      </Routes>
    </BrowserRouter>
  );
}
