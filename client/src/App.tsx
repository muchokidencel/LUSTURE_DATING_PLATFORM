import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cn } from './lib/utils';
import Login from './pages/Login';
import Register from './pages/Register';
import Discovery from './pages/Discovery';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import Matches from './pages/Matches';
import Premium from './pages/Premium';
import AdminDashboard from './pages/AdminDashboard';
import ReferralDashboard from './pages/ReferralDashboard';
import Landing from './pages/Landing';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import TourGuide from './components/layout/TourGuide';
import { TourProvider } from './context/TourContext';
import { Loader2 } from 'lucide-react';


const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-void">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
        <span className="font-garamond italic text-2xl text-gradient-brand">Lustre</span>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-void gap-4">
      <Loader2 size={40} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
      <p className="text-lustre-purple font-garamond text-xl italic">Authenticating Admin...</p>
    </div>
  );

  const isAdmin = user?.role === 'admin';
  return user && isAdmin ? <>{children}</> : <Navigate to="/" />;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

function AnimatedRoutes() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-void text-lustre-text transition-colors duration-300 lustre-orbs">
      {!isAdminPath && <Navbar />}
      {!isAdminPath && isAuthenticated && <TourGuide />}
      <div className={cn(isAdminPath ? "pt-0 pb-0" : "pt-16 pb-24 md:pb-0")}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/discovery" element={
              <PrivateRoute>
                <PageWrapper><Discovery /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/matching" element={
              <PrivateRoute>
                <PageWrapper><Recommendations /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <PageWrapper><Profile /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/profile/:id" element={
              <PrivateRoute>
                <PageWrapper><UserProfile /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/profile/edit" element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            } />
            <Route path="/matches" element={
              <PrivateRoute>
                <PageWrapper><Matches /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/premium" element={
              <PrivateRoute>
                <PageWrapper><Premium /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/referrals" element={
              <PrivateRoute>
                <PageWrapper><ReferralDashboard /></PageWrapper>
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <PageWrapper><AdminDashboard /></PageWrapper>
              </AdminRoute>
            } />
          </Routes>
        </AnimatePresence>
      </div>
      {!isAdminPath && isAuthenticated && <BottomNav />}
    </div>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="dating-theme">
        <AuthProvider>
          <Router>
            <TourProvider>
              <AnimatedRoutes />
            </TourProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
