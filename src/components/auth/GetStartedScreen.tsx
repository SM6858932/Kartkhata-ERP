import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingCart, Wallet, MapPin, ArrowRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface GetStartedScreenProps {
  onGetStarted: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE 1: Mechanical Assembly Animation
   Steel plates + gears + wheels fly in and assemble into a food cart
   ═══════════════════════════════════════════════════════════════ */
const AssemblyAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setPhase(5);
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Parts fly in
      setTimeout(() => setPhase(2), 1600),   // Assemble
      setTimeout(() => setPhase(3), 2800),   // Glow & lock
      setTimeout(() => setPhase(4), 3600),   // Name types out
      setTimeout(() => setPhase(5), 5200),   // Ready
    ];
    return () => timers.forEach(clearTimeout);
  }, [prefersReduced]);

  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
      {/* ── Sparks / Welding particles ── */}
      {phase >= 1 && phase < 3 && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 0.5, 0],
                x: [0, (Math.random() - 0.5) * 120],
                y: [0, (Math.random() - 0.5) * 120],
              }}
              transition={{
                duration: 0.8,
                delay: 0.8 + i * 0.15,
                repeat: 2,
                ease: 'easeOut',
              }}
              style={{ left: '50%', top: '50%' }}
            />
          ))}
        </>
      )}

      {/* ── STEEL PLATE: Cart Body (center rectangle) ── */}
      <motion.div
        className="absolute rounded-xl border-2 border-slate-400/80 shadow-lg"
        style={{ width: 120, height: 80 }}
        initial={{ opacity: 0, y: -180, rotate: -25, scale: 0.4 }}
        animate={
          phase >= 2
            ? { opacity: 1, y: 0, rotate: 0, scale: 1, borderColor: '#f97316' }
            : phase >= 1
            ? { opacity: 0.7, y: -60, rotate: -15, scale: 0.7 }
            : {}
        }
        transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.8 }}
      >
        {/* Metallic surface gradient */}
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700 overflow-hidden relative">
          {/* Brushed metal texture lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-px bg-white/40" style={{ marginTop: i * 14 }} />
            ))}
          </div>
          {/* Rivets */}
          <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner" />
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner" />
          <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner" />
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner" />
        </div>
      </motion.div>

      {/* ── CANOPY (top roof plate) ── */}
      <motion.div
        className="absolute"
        style={{ width: 140, height: 18, top: '22%' }}
        initial={{ opacity: 0, y: -220, x: 80, rotate: 30 }}
        animate={
          phase >= 2
            ? { opacity: 1, y: -50, x: 0, rotate: 0 }
            : phase >= 1
            ? { opacity: 0.5, y: -120, x: 40, rotate: 15 }
            : {}
        }
        transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.15 }}
      >
        <div className="w-full h-full rounded-t-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-lg border border-orange-400/60">
          <div className="absolute inset-0 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent" />
        </div>
        {/* Canopy support poles */}
        <div className="absolute -bottom-6 left-3 w-1 h-6 bg-slate-500 rounded-full" />
        <div className="absolute -bottom-6 right-3 w-1 h-6 bg-slate-500 rounded-full" />
      </motion.div>

      {/* ── LEFT WHEEL ── */}
      <motion.div
        className="absolute"
        style={{ left: '25%', bottom: '22%' }}
        initial={{ opacity: 0, x: -160, y: 60, rotate: -180 }}
        animate={
          phase >= 2
            ? { opacity: 1, x: 0, y: 44, rotate: 0 }
            : phase >= 1
            ? { opacity: 0.5, x: -80, y: 50, rotate: -90 }
            : {}
        }
        transition={{ type: 'spring', stiffness: 100, damping: 14, delay: 0.25 }}
      >
        <motion.div
          animate={phase >= 3 ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-10 h-10 rounded-full border-[3px] border-slate-400 bg-slate-700 flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-400" />
            {/* Spokes */}
            <div className="absolute w-full h-px bg-slate-500/60 top-1/2" />
            <div className="absolute h-full w-px bg-slate-500/60 left-1/2" />
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT WHEEL ── */}
      <motion.div
        className="absolute"
        style={{ right: '25%', bottom: '22%' }}
        initial={{ opacity: 0, x: 160, y: 60, rotate: 180 }}
        animate={
          phase >= 2
            ? { opacity: 1, x: 0, y: 44, rotate: 0 }
            : phase >= 1
            ? { opacity: 0.5, x: 80, y: 50, rotate: 90 }
            : {}
        }
        transition={{ type: 'spring', stiffness: 100, damping: 14, delay: 0.3 }}
      >
        <motion.div
          animate={phase >= 3 ? { rotate: -360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-10 h-10 rounded-full border-[3px] border-slate-400 bg-slate-700 flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-400" />
            <div className="absolute w-full h-px bg-slate-500/60 top-1/2" />
            <div className="absolute h-full w-px bg-slate-500/60 left-1/2" />
          </div>
        </motion.div>
      </motion.div>

      {/* ── HANDLE (right side push bar) ── */}
      <motion.div
        className="absolute"
        style={{ right: '12%', top: '38%' }}
        initial={{ opacity: 0, x: 120, rotate: 45 }}
        animate={
          phase >= 2
            ? { opacity: 1, x: 0, rotate: 0 }
            : phase >= 1
            ? { opacity: 0.4, x: 60, rotate: 20 }
            : {}
        }
        transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.35 }}
      >
        <div className="w-2 h-16 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full shadow-md" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-3 rounded-full bg-slate-500 border border-slate-400" />
      </motion.div>

      {/* ── GEAR (decorative — bottom left) ── */}
      <motion.div
        className="absolute"
        style={{ left: '8%', bottom: '30%' }}
        initial={{ opacity: 0, scale: 0, rotate: -90 }}
        animate={
          phase >= 1
            ? { opacity: phase >= 2 ? 0.3 : 0.6, scale: 1, rotate: phase >= 3 ? 360 : 0 }
            : {}
        }
        transition={{ duration: phase >= 3 ? 4 : 0.6, repeat: phase >= 3 ? Infinity : 0, ease: phase >= 3 ? 'linear' : 'easeOut', delay: 0.1 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </motion.div>

      {/* ── BOLT (decorative — top right) ── */}
      <motion.div
        className="absolute"
        style={{ right: '10%', top: '15%' }}
        initial={{ opacity: 0, scale: 0, rotate: 90 }}
        animate={
          phase >= 1
            ? { opacity: phase >= 2 ? 0.25 : 0.5, scale: 1, rotate: phase >= 3 ? -360 : 0 }
            : {}
        }
        transition={{ duration: phase >= 3 ? 5 : 0.5, repeat: phase >= 3 ? Infinity : 0, ease: phase >= 3 ? 'linear' : 'easeOut' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500/60">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </motion.div>

      {/* ── Assembly GLOW flash ── */}
      {phase >= 3 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.8, 2.5] }}
          transition={{ duration: 1 }}
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)',
          }}
        />
      )}

      {/* ── CART EMOJI (appears on lock phase as the final product) ── */}
      {phase >= 3 && (
        <motion.div
          className="absolute text-5xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.3 }}
          style={{ top: '30%', left: '50%', transform: 'translateX(-50%)' }}
        >
          🛒
        </motion.div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SLIDE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
const FEATURE_SLIDES = [
  {
    icon: <ShoppingCart className="w-12 h-12 text-white" />,
    badge: '🚀 Operational ERP',
    title: 'Operational ERP',
    subtitle: 'Digitize food cart rental & daily field collections in real-time across all operating zones.',
    gradient: 'from-orange-600 via-amber-600 to-orange-700',
    features: ['Multi-zone management', 'Role-based access'],
  },
  {
    icon: <Wallet className="w-12 h-12 text-white" />,
    badge: '💰 Smart Ledger',
    title: 'Smart Ledger Accounting',
    subtitle: 'Unpaid monthly shortfalls automatically carry forward. Generate WhatsApp receipts & PDF invoices with 1 tap.',
    gradient: 'from-indigo-600 via-purple-600 to-indigo-800',
    features: ['Carry-forward balances', '1-tap WhatsApp receipts'],
  },
  {
    icon: <MapPin className="w-12 h-12 text-white" />,
    badge: '📍 Asset Tracking',
    title: 'Real-Time GPS Map',
    subtitle: 'Track operational cart locations across zones with interactive Leaflet map pins and live GPS updates from field staff.',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    features: ['Live GPS pins', 'On-site field updates'],
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ onGetStarted }) => {
  const [slideIndex, setSlideIndex] = useState(0); // 0 = assembly, 1-3 = features
  const [assemblyDone, setAssemblyDone] = useState(false);
  const [titlePhase, setTitlePhase] = useState(0); // 0=hidden, 1=typing, 2=done
  const prefersReduced = useReducedMotion();

  // Title typing effect for Slide 1
  const appName = 'Food Cart Rent Manager';
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (slideIndex !== 0 || !assemblyDone) return;
    setTitlePhase(1);
    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setTypedChars(i);
      if (i >= appName.length) {
        clearInterval(typeInterval);
        setTimeout(() => setTitlePhase(2), 400);
      }
    }, prefersReduced ? 10 : 55);
    return () => clearInterval(typeInterval);
  }, [assemblyDone, slideIndex, prefersReduced]);

  const isAssemblySlide = slideIndex === 0;
  const featureSlide = !isAssemblySlide ? FEATURE_SLIDES[slideIndex - 1] : null;
  const currentGradient = isAssemblySlide
    ? 'from-slate-900 via-slate-800 to-slate-950'
    : featureSlide!.gradient;

  const totalSlides = 4;

  const handleNext = () => {
    if (slideIndex < totalSlides - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      onGetStarted();
    }
  };

  const canProceedFromAssembly = assemblyDone && titlePhase >= 2;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-5 bg-gradient-to-br ${currentGradient} transition-all duration-700 relative overflow-hidden select-none`}
    >
      {/* ─── Top Row: Badge + Skip ─── */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-3">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-bold border border-white/10 shadow-sm">
          {isAssemblySlide ? (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚙️ Assembly Mode</span>
            </>
          ) : (
            <span>{featureSlide!.badge}</span>
          )}
        </div>
        <button
          onClick={onGetStarted}
          className="text-[11px] font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition border border-white/10"
        >
          Skip
        </button>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {isAssemblySlide ? (
            /* ════ SLIDE 1: Mechanical Assembly ════ */
            <motion.div
              key="assembly"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <AssemblyAnimation onComplete={() => setAssemblyDone(true)} />

              {/* Assembly phase listener */}
              <AssemblyPhaseWatcher onDone={() => setAssemblyDone(true)} />

              {/* Typed app name */}
              <div className="mt-6 h-16 flex flex-col items-center justify-center">
                {titlePhase >= 1 && (
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 font-outfit tracking-tight"
                  >
                    {appName.slice(0, typedChars)}
                    {titlePhase === 1 && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className="text-orange-400"
                      >
                        |
                      </motion.span>
                    )}
                  </motion.h1>
                )}
                {titlePhase >= 2 && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-white/70 mt-2 font-medium"
                  >
                    Built for speed. Designed for the field.
                  </motion.p>
                )}
              </div>
            </motion.div>
          ) : (
            /* ════ SLIDES 2-4: Feature Showcase ════ */
            <motion.div
              key={`feature-${slideIndex}`}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center text-center"
            >
              {/* Floating animated icon */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-8 shadow-2xl relative"
              >
                {featureSlide!.icon}
                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg text-sm font-black">
                  {slideIndex}
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl font-black text-white mb-3 font-outfit tracking-tight"
              >
                {featureSlide!.title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base text-white/85 leading-relaxed max-w-xs px-2 font-medium"
              >
                {featureSlide!.subtitle}
              </motion.p>

              {/* Feature highlight pills */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-2 mt-6 flex-wrap justify-center"
              >
                {featureSlide!.features.map((feat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-bold border border-white/15 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    {feat}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Controls ─── */}
      <div className="w-full max-w-md z-10 space-y-5 pb-6">
        {/* Slide indicators */}
        <div className="flex items-center justify-center gap-2">
          {[...Array(totalSlides)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx === 0 || canProceedFromAssembly || idx <= slideIndex) setSlideIndex(idx);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                slideIndex === idx
                  ? 'w-9 bg-white shadow-lg shadow-white/30'
                  : 'w-2.5 bg-white/25 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          disabled={isAssemblySlide && !canProceedFromAssembly}
          className={`w-full py-4 px-6 font-extrabold text-base rounded-2xl shadow-2xl flex items-center justify-center gap-2 transition active:scale-95 ${
            isAssemblySlide && !canProceedFromAssembly
              ? 'bg-white/20 text-white/40 cursor-not-allowed'
              : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>
            {isAssemblySlide
              ? canProceedFromAssembly
                ? 'Explore Features'
                : 'Assembling...'
              : slideIndex < totalSlides - 1
              ? 'Next'
              : 'Get Started'}
          </span>
          {(!isAssemblySlide || canProceedFromAssembly) && (
            slideIndex < totalSlides - 1 ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ArrowRight className="w-5 h-5 text-orange-600" />
            )
          )}
        </motion.button>
      </div>

      {/* ─── Decorative background spheres ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-80 h-80 bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-white rounded-full blur-3xl"
        />
      </div>
    </div>
  );
};

/* Helper: fires onDone after assembly animation completes (~5.2s) */
const AssemblyPhaseWatcher: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 5200);
    return () => clearTimeout(t);
  }, [onDone]);
  return null;
};
