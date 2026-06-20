import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useProfile } from '../hooks/useQueries';

export interface TourStep {
  targetIds: string[]; // DOM IDs to try highlighting (desktop and mobile fallbacks)
  title: string;
  content: string;
  path: string; // Navigates here before highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile(!!user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isPremium = profile?.premiumTier !== 'free';

  const steps: TourStep[] = [
    {
      targetIds: [],
      title: "Welcome to Lustre",
      content: "Discover a private, curated environment where high-caliber connections shine. I am Aura, your personal concierge. Let's take a quick walk through the space.",
      path: "/discovery",
      position: "center",
    },
    {
      targetIds: ["discovery-grid"],
      title: "The Community Grid",
      content: isPremium 
        ? "This is the active community grid. As an Elite member, you have full ungated access to browse, filter, and view details of all active members in real-time."
        : "Browse active members nearby in real-time. Free members can view matches and invitees, but full Grid exploration is unlocked with an Elite upgrade.",
      path: "/discovery",
      position: "top",
    },
    {
      targetIds: ["discovery-tabs-switcher"],
      title: "Discovery Switcher",
      content: "Lustre offers two ways to seek chemistry: Grid View (browsing the online directory) and Swipe View (compatibility-based selection). Use this control to switch between them.",
      path: "/discovery",
      position: "bottom",
    },
    {
      targetIds: ["recommendations-card-area"],
      title: "Swipe Matching",
      content: isPremium
        ? "This is your Swipe View. Our algorithm presents highly compatible profiles. As an Elite member, you have unlimited matches and top-tier placement in recommendations."
        : "Receive daily curated recommendations. Swipe right (or click Heart) to like, swipe left to pass. Free members receive 20 matching recommendations daily.",
      path: "/matching",
      position: "top",
    },
    {
      targetIds: ["nav-matches", "bottom-nav-matches"],
      title: "Connections & Chats",
      content: "When mutual interest is found, a Shared Spark is created. Go to Matches to see your connections and initiate direct, private chats.",
      path: "/matches",
      position: "bottom",
    },
    {
      targetIds: ["nav-referrals", "bottom-nav-rewards"],
      title: "Rewards & Referrals",
      content: "Lustre operates on trust and invitations. Invite friends with your exclusive VIP referral code. You earn a substantial 10% commission (KES 50) when they upgrade to Elite.",
      path: "/referrals",
      position: "bottom",
    },
    {
      targetIds: ["nav-premium", "bottom-nav-premium"],
      title: "Elite Membership Hub",
      content: isPremium
        ? "Your premium subscription is active! Thank you for maintaining Elite membership. You currently enjoy unlimited swiping, ungated grid discovery, and absolute visibility."
        : "Elevate your experience. Subscribe to Elite to unlock unlimited swipes, active grid exploration, priority visibility, and direct contact reveals.",
      path: "/premium",
      position: "bottom",
    },
  ];

  // Auto-start tour for new users who haven't completed it
  useEffect(() => {
    // Disable auto-start in automated testing environments
    if (window.navigator.webdriver || window.__E2E_TESTING__) {
      return;
    }
    if (user && !localStorage.getItem(`lustre_tour_completed_${user.id}`)) {
      // Delay slightly to wait for layout mount
      const timer = setTimeout(() => {
        setIsTourActive(true);
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
    navigate(steps[0].path);
  };

  const endTour = () => {
    setIsTourActive(false);
    if (user) {
      localStorage.setItem(`lustre_tour_completed_${user.id}`, 'true');
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextIndex = currentStep + 1;
      const nextStepData = steps[nextIndex];
      setCurrentStep(nextIndex);
      
      // Auto-navigate if the path changes
      if (location.pathname !== nextStepData.path) {
        navigate(nextStepData.path);
      }
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      const prevStepData = steps[prevIndex];
      setCurrentStep(prevIndex);

      // Auto-navigate if the path changes
      if (location.pathname !== prevStepData.path) {
        navigate(prevStepData.path);
      }
    }
  };

  return (
    <TourContext.Provider value={{
      isTourActive,
      currentStep,
      steps,
      startTour,
      endTour,
      nextStep,
      prevStep
    }}>
      {children}
    </TourContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
