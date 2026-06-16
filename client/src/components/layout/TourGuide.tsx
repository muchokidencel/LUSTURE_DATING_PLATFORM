import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../../context/TourContext';
import { Button } from '../ui/button';
import { Sparkles, ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function TourGuide() {
  const { isTourActive, currentStep, steps, nextStep, prevStep, endTour } = useTour();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const checkCountRef = useRef(0);

  const step = steps[currentStep];

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update target rect based on active step targetIds
  useEffect(() => {
    if (!isTourActive || !step) {
      setTargetRect(null);
      return;
    }

    const findAndMeasureElement = () => {
      if (!step.targetIds || step.targetIds.length === 0) {
        setTargetRect(null);
        return false;
      }

      for (const id of step.targetIds) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Verify element is visible and has size
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            return true;
          }
        }
      }
      setTargetRect(null);
      return false;
    };

    // Run immediately
    const found = findAndMeasureElement();

    // If not found (e.g. page is still loading or rendering), poll briefly
    if (!found) {
      checkCountRef.current = 0;
      const interval = setInterval(() => {
        const again = findAndMeasureElement();
        checkCountRef.current += 1;
        if (again || checkCountRef.current > 20) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isTourActive, currentStep, step, windowSize, location.pathname]);

  if (!isTourActive || !step) return null;

  // Calculate coordinates with padding
  const padding = 8;
  const highlightStyle = targetRect ? {
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  } : null;

  // Determine dialog position relative to target
  let dialogStyle: React.CSSProperties = {};
  if (highlightStyle) {
    const dialogWidth = 320;
    const dialogHeight = 220;
    const gap = 16;

    const targetCenterX = highlightStyle.left + highlightStyle.width / 2;
    const targetCenterY = highlightStyle.top + highlightStyle.height / 2;

    // Default: Center below
    let x = targetCenterX - dialogWidth / 2;
    let y = highlightStyle.top + highlightStyle.height + gap;

    if (step.position === 'top') {
      y = highlightStyle.top - dialogHeight - gap;
    } else if (step.position === 'bottom') {
      y = highlightStyle.top + highlightStyle.height + gap;
    } else if (step.position === 'left') {
      x = highlightStyle.left - dialogWidth - gap;
      y = targetCenterY - dialogHeight / 2;
    } else if (step.position === 'right') {
      x = highlightStyle.left + highlightStyle.width + gap;
      y = targetCenterY - dialogHeight / 2;
    }

    // Keep dialog on screen bounds
    x = Math.max(16, Math.min(x, window.innerWidth - dialogWidth - 16));
    y = Math.max(80, Math.min(y, window.innerHeight - dialogHeight - 16));

    dialogStyle = {
      position: 'fixed',
      left: x,
      top: y,
      width: dialogWidth,
      zIndex: 1000,
    };
  } else {
    // Center of screen
    dialogStyle = {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 320,
      zIndex: 1000,
    };
  }

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden pointer-events-none">
      {/* Darkened overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 pointer-events-auto transition-opacity duration-500"
        onClick={endTour}
      />

      {/* Spotlight cutout */}
      <AnimatePresence>
        {highlightStyle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="absolute rounded-xl border border-lustre-purple/60 pointer-events-auto"
            style={{
              ...highlightStyle,
              position: 'fixed',
              boxShadow: '0 0 0 9999px rgba(8, 8, 15, 0.75), 0 0 15px var(--purple)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Concierge Aura Guide Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        style={dialogStyle}
        className="bg-card/95 border border-white/10 rounded-2xl p-6 shadow-glow-purple backdrop-blur-xl pointer-events-auto"
      >
        {/* Skip button top-right */}
        <button 
          onClick={endTour}
          className="absolute top-4 right-4 text-lustre-faint hover:text-white transition-colors"
          aria-label="Skip Tour"
        >
          <X size={14} />
        </button>

        <div className="flex flex-col gap-4">
          {/* Header section with Concierge Avatar */}
          <div className="flex items-center gap-3">
            {/* Animated pulsing gradient orb representing Aura */}
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-60 blur-[4px] animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-lustre-purple/40 animate-spin-slow" />
              <Sparkles size={12} className="text-white relative z-10 animate-pulse" />
            </div>
            <div>
              <span className="font-headline text-[9px] uppercase tracking-[0.25em] text-lustre-purple font-bold">Lustre Guide</span>
              <h4 className="font-headline text-xs font-semibold text-white tracking-wide">{step.title}</h4>
            </div>
          </div>

          {/* Guide description text */}
          <p className="font-sans text-xs text-lustre-text leading-relaxed">
            {step.content}
          </p>

          {/* Navigation and step counters */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-2">
            <span className="font-sans text-[9px] text-lustre-faint font-bold uppercase tracking-wider">
              {currentStep + 1} / {steps.length}
            </span>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button 
                  onClick={prevStep}
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-[9px] uppercase font-bold tracking-widest text-lustre-muted hover:text-white"
                >
                  <ArrowLeft size={10} className="mr-1" />
                  Back
                </Button>
              )}

              <Button 
                onClick={nextStep}
                className="h-8 px-4 text-[9px] uppercase font-bold tracking-widest bg-gradient-brand text-white shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && <ArrowRight size={10} className="ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
