import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles, Heart, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import ShaderBackground from '../components/ui/ShaderBackground';

export default function Landing() {
  return (
    <div className="min-h-screen bg-void text-lustre-text overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Shader Background */}
        <ShaderBackground className="absolute inset-0 w-full h-full opacity-40" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-garamond italic text-7xl md:text-8xl leading-tight mb-8 tracking-tight text-lustre-text"
          >
            Where connections <span className="text-gradient-brand">shine.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-sans text-lg text-lustre-muted mb-12 max-w-2xl leading-relaxed"
          >
            Experience a curated environment where quality meets chemistry. Meet people worth knowing in a space designed for modern refinement.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
             <Button size="lg" className="w-full sm:w-auto px-10 h-14 font-headline text-[10px] uppercase tracking-widest font-bold shadow-[var(--shadow-card-hover)] hover:scale-105 transition-all" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 h-14 border-border-subtle text-lustre-text font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-hover transition-all" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown className="w-8 h-8 text-lustre-text" strokeWidth={1.5} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-base relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <span className="text-lustre-purple font-headline text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold">The Lustre Standard</span>
            <h2 className="font-headline text-4xl md:text-5xl text-lustre-text">Elevated dating, reimagined.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] rounded-xl transition-all duration-500 p-10 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-lg bg-elevated flex items-center justify-center mb-8 group-hover:bg-lustre-purple-dim/20 transition-all border border-border-subtle">
                  <Sparkles size={24} strokeWidth={1.5} className="text-lustre-purple group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-headline font-semibold text-lustre-text mb-4 text-lg">Smart Matching</h3>
                <p className="font-sans text-sm text-lustre-muted leading-relaxed">
                  Our proprietary algorithm goes beyond surface-level traits, connecting you based on values, lifestyle, and intellectual synergy.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] rounded-xl transition-all duration-500 p-10 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-lg bg-elevated flex items-center justify-center mb-8 group-hover:bg-lustre-purple-dim/20 transition-all border border-border-subtle">
                  <Heart size={24} strokeWidth={1.5} className="text-lustre-purple group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-headline font-semibold text-lustre-text mb-4 text-lg">Real Connections</h3>
                <p className="font-sans text-sm text-lustre-muted leading-relaxed">
                  Verified profiles and a curated community ensure that every interaction has the potential for something lasting and significant.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] rounded-xl transition-all duration-500 p-10 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-lg bg-elevated flex items-center justify-center mb-8 group-hover:bg-lustre-purple-dim/20 transition-all border border-border-subtle">
                  <Crown size={24} strokeWidth={1.5} className="text-lustre-purple group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-headline font-semibold text-lustre-text mb-4 text-lg">Premium Experience</h3>
                <p className="font-sans text-sm text-lustre-muted leading-relaxed">
                  Enjoy an ad-free, clutter-free environment focused entirely on your journey to find someone exceptional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Bottom CTA */}
      <section className="py-40 bg-void relative overflow-hidden">
        <div className="absolute inset-0 bg-lustre-purple/5 blur-[120px] rounded-full -translate-y-1/2 scale-150"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center px-6">
          <h2 className="font-garamond italic text-5xl md:text-6xl text-lustre-text mb-10">Ready for something better?</h2>
          <Button size="lg" className="px-12 h-14 font-headline text-[10px] uppercase tracking-widest font-bold shadow-[var(--shadow-card-hover)] hover:scale-105 transition-all" asChild>
            <Link to="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card-alt py-24 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="font-garamond italic text-3xl text-lustre-purple">Lustre</div>
            <p className="font-sans text-sm text-lustre-muted leading-relaxed max-w-xs">
              The world's most refined dating experience for high-intent individuals.
            </p>
          </div>
          <div>
            <h4 className="font-headline text-[10px] uppercase tracking-widest text-lustre-purple mb-8 font-bold">Product</h4>
            <ul className="space-y-4 font-sans text-sm text-lustre-muted">
              <li><Link to="/discovery" className="hover:text-lustre-text transition-colors">Discovery</Link></li>
              <li><Link to="/matches" className="hover:text-lustre-text transition-colors">Matches</Link></li>
              <li><Link to="/premium" className="hover:text-lustre-text transition-colors">Premium</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-[10px] uppercase tracking-widest text-lustre-purple mb-8 font-bold">Company</h4>
            <ul className="space-y-4 font-sans text-sm text-lustre-muted">
              <li><a href="#" className="hover:text-lustre-text transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-lustre-text transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-lustre-text transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline text-[10px] uppercase tracking-widest text-lustre-purple mb-8 font-bold">Legal</h4>
            <ul className="space-y-4 font-sans text-sm text-lustre-muted">
              <li><a href="#" className="hover:text-lustre-text transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-lustre-text transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-lustre-text transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-24 pt-8 border-t border-outline-variant/10 text-center text-lustre-faint font-headline text-[9px] uppercase tracking-[0.2em]">
          © 2026 Lustre Technologies Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

