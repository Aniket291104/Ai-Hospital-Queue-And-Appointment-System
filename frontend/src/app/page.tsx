'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  Variants,
} from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  LogIn,
  UserPlus,
  Brain,
  Clock,
  FileText,
  Users,
  Video,
  Bell,
  ChevronRight,
  ArrowRight,
  Heart,
  Zap,
  CheckCircle2,
  Star,
  Activity,
} from 'lucide-react';

/* ─── Reusable animation variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -56 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 56 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 },
  }),
};

/* ─── Scroll-triggered section wrapper ─── */
function ScrollReveal({
  children,
  className = '',
  variants = fadeUp,
  custom = 0,
  threshold = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  custom?: number;
  threshold?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: threshold });
  return (
    <motion.div
      ref={ref}
      variants={variants}
      custom={custom}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.5 });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = React.useState('0');

  React.useEffect(() => {
    if (inView) {
      spring.set(target);
    } else {
      // Reset to 0 when scrolled out so it re-animates on next entry
      spring.set(0);
      setDisplay('0');
    }
  }, [inView, target, spring]);

  React.useEffect(() => {
    return spring.on('change', (v) => {
      setDisplay(
        target % 1 !== 0 ? v.toFixed(1) : Math.floor(v).toString()
      );
    });
  }, [spring, target]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen w-full bg-[#DAE3EE] text-[#2C3137] font-urbanist overflow-x-hidden select-none">
      {/* ── Sticky Nav ── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#DAE3EE]/80 border-b border-white/30 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-extrabold text-base shadow">
              H
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight">HospitalAI</p>
              <p className="text-[9px] text-[#7C7C7C] font-semibold">Smart Queue. Better Care.</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#7C7C7C]">
            {['Features', 'Queue', 'Telemedicine', 'Doctors'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-[#6AB8FF] transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-white/80 hover:bg-white transition-all px-4 py-2 rounded-full text-xs font-bold border border-white/40 shadow-sm"
            >
              <LogIn className="w-3 h-3" /> Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all"
            >
              <UserPlus className="w-3 h-3" /> Sign Up
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Parallax glow background */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[900px] h-[600px] rounded-full bg-gradient-to-br from-[#6AB8FF]/20 via-[#CFA3F6]/15 to-transparent blur-3xl" />
        </motion.div>

        {/* DNA Helix decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center">
          <svg className="w-full h-full min-w-[1000px]" viewBox="0 0 1200 600" fill="none">
            <defs>
              <linearGradient id="dnaG1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6AB8FF" />
                <stop offset="100%" stopColor="#CFA3F6" />
              </linearGradient>
            </defs>
            <path d="M-50,300 C150,150 250,450 450,300 C650,150 750,450 950,300 C1150,150 1200,300 1300,300" stroke="url(#dnaG1)" strokeWidth="5" strokeLinecap="round" />
            <path d="M-50,300 C150,450 250,150 450,300 C650,450 750,150 950,300 C1150,450 1200,300 1300,300" stroke="url(#dnaG1)" strokeWidth="3" strokeDasharray="4 10" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 bg-white/70 border border-white/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#7C7C7C] shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Trusted by 240+ hospitals · AI-powered care
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]"
          >
            Smart Queue.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">
              Better Care.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base text-[#7C7C7C] font-semibold max-w-2xl mx-auto leading-relaxed"
          >
            HospitalAI modernizes every healthcare visit — automated check-ins, AI symptom triage,
            live queue tracking, digital prescriptions, and telemedicine in one beautiful platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-sm shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 px-8 py-3.5 font-bold text-[#2C3137] bg-white/80 hover:bg-white rounded-full text-sm shadow-sm border border-white/50 hover:scale-[1.03] transition-all"
            >
              Hospital Staff Portal
            </Link>
          </motion.div>

          {/* Heartbeat monitor */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl px-6 py-4 shadow-md max-w-xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">Live patient monitoring</span>
            </div>
            <svg className="w-full h-12 overflow-visible" viewBox="0 0 500 48">
              <motion.path
                d="M0,24 L60,24 L75,6 L88,42 L100,12 L113,36 L125,24 L200,24 L215,6 L228,42 L240,12 L253,36 L265,24 L340,24 L355,6 L368,42 L380,12 L393,36 L405,24 L500,24"
                fill="none"
                stroke="url(#hbGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.0, duration: 2.2, ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="hbGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6AB8FF" />
                  <stop offset="100%" stopColor="#CFA3F6" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="405" cy="24" r="5"
                fill="#CFA3F6"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 1] }}
                transition={{ delay: 3.0, duration: 1.5, repeat: Infinity }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-[9px] font-bold text-[#7C7C7C] uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-5 rounded-full border-2 border-[#7C7C7C]/40 flex items-center justify-center"
          >
            <ChevronRight className="w-3 h-3 text-[#7C7C7C] rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-16 bg-white/40 border-y border-white/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 4.2, suffix: 'M+', label: 'Appointments' },
            { value: 98, suffix: '%', label: 'Triage accuracy' },
            { value: 8, suffix: 'min', label: 'Wait reduction' },
            { value: 240, suffix: '+', label: 'Partner hospitals' },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} custom={i} threshold={0.3} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-[#6AB8FF] to-[#CFA3F6]">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-bold text-[#7C7C7C] mt-1">{stat.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/70 border border-white/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#6AB8FF] uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Everything you need,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">nothing you don&apos;t</span>
            </h2>
            <p className="text-sm text-[#7C7C7C] font-semibold max-w-xl mx-auto">
              Six AI-powered tools that transform every step of the patient journey.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, color: 'from-[#6AB8FF] to-[#4f9de0]', label: 'AI Triage', title: 'Smart Symptom Assessment', desc: 'Describe your symptoms naturally. AI routes you to the right specialist, predicts triage priority, and reduces diagnostic time by 60%.' },
              { icon: Activity, color: 'from-[#CFA3F6] to-[#b07de0]', label: 'Live Queue', title: 'Real-time Wait Times', desc: 'Track your exact token position and dynamic wait estimates from anywhere. Get push alerts when your turn is 2 tokens away.' },
              { icon: Video, color: 'from-[#6AB8FF] to-[#CFA3F6]', label: 'Telemedicine', title: 'See a Doctor in 15 Min', isNew: true, desc: 'HD video consultations, 7 days a week. Board-certified physicians, zero travel, instant e-prescriptions sent to your pharmacy.' },
              { icon: FileText, color: 'from-[#CFA3F6] to-[#6AB8FF]', label: 'Health Records', title: 'Unified Medical History', isNew: true, desc: 'All your lab results, vitals, prescriptions, and imaging in one secure place. Share with any doctor in one tap.' },
              { icon: ShieldAlert, color: 'from-[#6AB8FF] to-[#4f9de0]', label: 'Prescription OCR', title: 'Digitize Handwriting', desc: 'Snap a photo of any prescription. AI reads handwriting, extracts dosage, sets medication reminders automatically.' },
              { icon: Users, color: 'from-[#CFA3F6] to-[#b07de0]', label: 'Family Profiles', title: 'Manage Whole Family', isNew: true, desc: 'Add family members, manage their appointments, track health records, and receive alerts — all from one account.' },
            ].map((feat, i) => (
              <ScrollReveal key={feat.title} variants={scaleIn} custom={i} threshold={0.1} className="group">
                <div className="h-full bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <feat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {feat.isNew && (
                        <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6AB8FF]/20 to-[#CFA3F6]/20 text-[#6AB8FF] border border-[#6AB8FF]/20 uppercase tracking-wider">
                          New
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-[#7C7C7C] uppercase tracking-widest">{feat.label}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold mb-2">{feat.title}</h3>
                    <p className="text-[11px] text-[#7C7C7C] font-semibold leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE QUEUE DEMO ── */}
      <section id="queue" className="py-24 px-6 bg-gradient-to-br from-[#DAE3EE] via-white/50 to-[#DAE3EE]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div className="space-y-6">
            <ScrollReveal variants={fadeLeft}>
              <div className="inline-flex items-center gap-2 bg-white/70 border border-white/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#CFA3F6] uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live Queue
              </div>
            </ScrollReveal>
            <ScrollReveal variants={fadeLeft} custom={1}>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                See exactly{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">
                  where you stand
                </span>
              </h2>
            </ScrollReveal>
            <ScrollReveal variants={fadeLeft} custom={2}>
              <p className="text-sm text-[#7C7C7C] font-semibold leading-relaxed">
                Never sit anxiously in a waiting room again. Track your token position in real-time, get notified when you&apos;re 2 tokens away, and see the estimated time down to the minute.
              </p>
            </ScrollReveal>
            <ScrollReveal variants={fadeLeft} custom={3}>
              <div className="space-y-3">
                {['Real-time token position updates', 'Push notification when 2 tokens away', 'View from home — arrive exactly on time'].map((pt, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#6AB8FF] flex-shrink-0" />
                    {pt}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right — Queue card */}
          <ScrollReveal variants={fadeRight} threshold={0.1}>
            <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/50">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7C7C7C]">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  OPD Queue — General Medicine
                </div>
                <span className="text-[10px] font-bold text-[#7C7C7C]">21 of 26 seen</span>
              </div>
              {/* Tokens */}
              {[
                { num: 'T-21', name: 'Ravi Menon', detail: 'Being attended · Room 3A', badge: 'Active', badgeColor: 'bg-green-100 text-green-600', numColor: 'text-[#6AB8FF]' },
                { num: 'T-22', name: 'Kavitha Iyer', detail: 'Waiting · ~4 min', badge: 'Waiting', badgeColor: 'bg-amber-100 text-amber-600', numColor: 'text-[#7C7C7C]' },
                { num: 'T-23', name: 'Priya Kapoor', detail: '~12 min · Your turn soon!', badge: 'You →', badgeColor: 'bg-[#6AB8FF]/20 text-[#6AB8FF]', numColor: 'text-[#CFA3F6]', isYou: true },
              ].map((token, i) => (
                <motion.div
                  key={token.num}
                  initial={{ opacity: 0, x: 32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-white/40 last:border-0 hover:bg-white/50 transition-colors ${token.isYou ? 'bg-[#6AB8FF]/5' : ''}`}
                >
                  <div className={`text-base font-extrabold min-w-[48px] ${token.numColor}`}>{token.num}</div>
                  <div className="flex-1">
                    <div className={`text-xs font-bold ${token.isYou ? 'text-[#6AB8FF]' : ''}`}>{token.name}</div>
                    <div className="text-[10px] text-[#7C7C7C] font-semibold mt-0.5">{token.detail}</div>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full ${token.badgeColor}`}>{token.badge}</span>
                </motion.div>
              ))}
              {/* Progress bar */}
              <div className="px-5 py-4 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-[#7C7C7C]">
                  <span>Queue progress</span>
                  <span>80%</span>
                </div>
                <div className="h-2 bg-[#DAE3EE] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: '80%' }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── TELEMEDICINE BANNER ── */}
      <section id="telemedicine" className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal variants={scaleIn}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6AB8FF] to-[#CFA3F6] p-10 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Decorative blob */}
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative space-y-4 text-white max-w-lg">
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <Video className="w-3 h-3" /> Telemedicine
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                  See a doctor in<br />
                  <span className="text-white/90">15 minutes</span>
                </h2>
                <p className="text-sm font-semibold text-white/80 leading-relaxed">
                  HD video consultations available 7 days a week. Board-certified doctors, zero commute, instant prescriptions.
                </p>
              </div>
              <Link
                href="/register"
                className="relative flex items-center gap-2 bg-white text-[#6AB8FF] font-extrabold px-8 py-4 rounded-2xl text-sm shadow-lg hover:scale-[1.04] hover:shadow-xl transition-all whitespace-nowrap"
              >
                <Zap className="w-4 h-4" />
                Start Video Consult →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DOCTORS ── */}
      <section id="doctors" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/70 border border-white/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#CFA3F6] uppercase tracking-widest">
              <Heart className="w-3 h-3" /> Find a Doctor
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Specialists ready{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">to see you</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { initials: 'RS', color: 'from-[#6AB8FF] to-[#4f9de0]', name: 'Dr. Rajesh Sharma', spec: 'Cardiology · 14 yrs', avail: 'Available today 3pm', rating: '4.9', dir: 'left' },
              { initials: 'PM', color: 'from-[#CFA3F6] to-[#b07de0]', name: 'Dr. Preethi Menon', spec: 'Neurology · 11 yrs', avail: 'Available tomorrow', rating: '4.8', dir: 'right' },
              { initials: 'AK', color: 'from-[#6AB8FF] to-[#CFA3F6]', name: 'Dr. Arjun Kapoor', spec: 'Orthopedics · 9 yrs', avail: 'Video consult now', rating: '4.7', dir: 'left' },
              { initials: 'SB', color: 'from-[#CFA3F6] to-[#6AB8FF]', name: 'Dr. Sunita Bajaj', spec: 'General Medicine · 16 yrs', avail: 'Available today 5pm', rating: '4.9', dir: 'right' },
            ].map((doc, i) => (
              <ScrollReveal
                key={doc.name}
                variants={doc.dir === 'left' ? fadeLeft : fadeRight}
                custom={Math.floor(i / 2)}
                threshold={0.1}
              >
                <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${doc.color} flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {doc.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold">{doc.name}</div>
                    <div className="text-[10px] text-[#7C7C7C] font-semibold mb-1">{doc.spec}</div>
                    <div className="text-[10px] font-bold text-[#6AB8FF]">✓ {doc.avail}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {doc.rating}
                    </div>
                  </div>
                  <Link
                    href="/register"
                    className="flex-shrink-0 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white text-[10px] font-extrabold px-4 py-2 rounded-full shadow hover:opacity-90 transition-all"
                  >
                    Book
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTIFICATIONS ── */}
      <section className="py-24 px-6 bg-white/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <ScrollReveal variants={fadeLeft}>
              <div className="inline-flex items-center gap-2 bg-white/70 border border-white/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#6AB8FF] uppercase tracking-widest">
                <Bell className="w-3 h-3" /> Smart Alerts
              </div>
            </ScrollReveal>
            <ScrollReveal variants={fadeLeft} custom={1}>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Stay ahead with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">smart alerts</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal variants={fadeLeft} custom={2}>
              <p className="text-sm text-[#7C7C7C] font-semibold leading-relaxed">
                Never miss a token call, medication dose, or lab result. HospitalAI sends the right notification at exactly the right moment.
              </p>
            </ScrollReveal>
          </div>

          <div className="space-y-4">
            {[
              { icon: Clock, bg: 'bg-[#6AB8FF]/10', iconColor: 'text-[#6AB8FF]', title: 'Your token is 3 ahead', sub: 'OPD — General Medicine · Room 3A', time: 'Just now' },
              { icon: FileText, bg: 'bg-[#CFA3F6]/10', iconColor: 'text-[#CFA3F6]', title: 'Medication reminder', sub: 'Metformin 500mg · Take with dinner', time: '7:00 PM' },
              { icon: Bell, bg: 'bg-amber-100', iconColor: 'text-amber-500', title: 'Lab results ready', sub: 'CBC Panel — All within normal range', time: '3 days ago' },
            ].map((notif, i) => (
              <ScrollReveal key={notif.title} variants={fadeRight} custom={i} threshold={0.1}>
                <div className="group flex items-center gap-4 bg-white/80 border border-white/50 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:translate-x-1 transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl ${notif.bg} flex items-center justify-center flex-shrink-0`}>
                    <notif.icon className={`w-4 h-4 ${notif.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold">{notif.title}</div>
                    <div className="text-[10px] text-[#7C7C7C] font-semibold mt-0.5 truncate">{notif.sub}</div>
                  </div>
                  <div className="text-[9px] font-bold text-[#7C7C7C] whitespace-nowrap">{notif.time}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
              Your health, on{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">
                your terms
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal custom={1}>
            <p className="text-sm text-[#7C7C7C] font-semibold leading-relaxed">
              Join 4.2 million patients already using HospitalAI to manage their healthcare seamlessly. It&apos;s free to get started.
            </p>
          </ScrollReveal>
          <ScrollReveal custom={2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 font-extrabold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-sm shadow-xl hover:shadow-2xl hover:scale-[1.04] transition-all"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 font-bold text-[#2C3137] bg-white hover:bg-white/90 rounded-full text-sm shadow-sm border border-white/50 hover:scale-[1.04] transition-all"
              >
                Hospital Staff Portal
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <ScrollReveal threshold={0.05}>
        <footer className="bg-white/40 border-t border-white/50 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-bold text-[#7C7C7C]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-extrabold text-xs shadow">H</div>
              <span className="font-extrabold text-[#2C3137] text-xs">HospitalAI</span>
              <span>·</span>
              <span>© {new Date().getFullYear()} HospitalAI Inc.</span>
            </div>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Support', 'For hospitals'].map((link) => (
                <a key={link} href="#" className="hover:text-[#6AB8FF] transition-colors duration-200">{link}</a>
              ))}
            </div>
          </div>
        </footer>
      </ScrollReveal>
    </div>
  );
}
