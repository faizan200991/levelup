import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { 
  Code2, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight, 
  Monitor, 
  MessageSquare, 
  Star,
  Plus,
  FileText,
  ChevronDown,
  CheckCircle2,
  Clock,
  MessageCircle,
  Code
} from 'lucide-react';

const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000"
];

function HeroCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden group bg-zinc-900">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={SLIDE_IMAGES[index]}
            className="w-full h-full object-cover brightness-[0.7]"
            referrerPolicy="no-referrer"
            alt="Collaborative Learning"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 flex items-center justify-center p-10 md:p-16 z-10">
        <div className="max-w-4xl text-center">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-600 text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20">
              <Zap className="w-3.5 h-3.5 fill-current" /> Next-Gen Learning
            </div>
            <h1 className="text-white text-4xl md:text-8xl font-bold tracking-tight leading-[0.95]">
              Interactive Classroom <br />
              <span className="text-blue-500">Experience</span>
            </h1>
            <p className="text-zinc-300 text-sm md:text-xl font-medium leading-relaxed max-w-2xl px-4 md:px-0">
              Master modern software engineering with real-time feedback from high-performance mentors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center w-full max-w-sm sm:max-w-none">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-zinc-100 hover:text-blue-600 text-white h-12 md:h-16 px-8 md:px-10 rounded-2xl text-sm md:text-lg font-bold shadow-xl border-none transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-zinc-900 h-12 md:h-16 px-8 md:px-10 rounded-2xl text-sm md:text-lg font-bold border-none transition-all shadow-xl">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 flex gap-1.5 z-20">
        {SLIDE_IMAGES.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-1000 ${i === index ? 'w-10 bg-blue-500' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-2xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-950 p-1.5 rounded-xl shadow-xl shadow-zinc-200">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter text-black uppercase">LEVELUP</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-200 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)] hover:bg-white transition-all transform hover:-translate-y-0.5">Sign In</Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-blue-100 font-bold border-none transition-all hover:scale-105">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen w-full">
        <HeroCard />
      </section>

      {/* Simplified Steps Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
              Empowering Teachers and Students
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg font-medium">A friendly classroom experience designed for learning, not just coding.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
                title: "Live Communication",
                desc: "Ask questions and get help instantly through our built-in classroom chat and AI tutor."
              },
              {
                icon: <Users className="w-6 h-6 text-cyan-600" />,
                title: "Work Together",
                desc: "Follow your teacher's logic in real-time or collaborate with peers on group challenges."
              },
              {
                icon: <Monitor className="w-6 h-6 text-amber-600" />,
                title: "Guided Learning",
                desc: "Step-by-step tracks and interactive exercises built to take you from beginner to pro."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-6 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-10 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
             <h2 className="font-display text-4xl font-bold tracking-tight text-zinc-950 mb-4">Loved by Students & Teachers</h2>
             <p className="text-zinc-500 max-w-md mx-auto font-medium">Join thousands of learners making progress every single day.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Prof. Aris Thorne"
              role="University Instructor"
              content="This platform changed how I teach remotely. My students feel more engaged and less overwhelmed by the tech."
              avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400"
            />
            <TestimonialCard 
              name="Sarah Jenkins"
              role="CS Student"
              content="The real-time collaboration makes group projects so much fun. I can finally see what my partner is doing!"
              avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400"
            />
            <TestimonialCard 
              name="Marcus V."
              role="Head of Education"
              content="A clean, professional tool that actually speaks the language of education. Reliable and easy to set up."
              avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-10 bg-white">
        <div className="max-w-5xl mx-auto rounded-[3.5rem] bg-[#0A0C10] p-16 md:p-20 text-center relative overflow-hidden shadow-2xl group border border-white/5">
          {/* Background Photo Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=2000" 
              alt="Coding Background" 
              className="w-full h-full object-cover opacity-20 brightness-75 mix-blend-luminosity scale-110 group-hover:scale-100 transition-transform duration-[4000ms]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-400/20" />
          </div>

          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-10">
              Start Your Coding <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Journey Today.</span>
            </h2>
            <Link to="/register">
              <Button size="lg" className="bg-white text-[#0A0C10] hover:bg-zinc-100 h-16 px-12 rounded-2xl text-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 border-none">
                Join the Classroom
              </Button>
            </Link>
            <p className="mt-8 text-zinc-500 font-bold uppercase tracking-widest text-[10px] opacity-80">Free for individual students and teachers</p>
          </motion.div>
        </div>
      </section>


      <footer className="py-12 bg-zinc-950 text-zinc-400 border-t border-zinc-900 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter uppercase text-white">LEVELUP</span>
          </div>
          
          <div className="flex flex-wrap gap-8 justify-center">
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Nodes</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Uptime</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">GitHub</a>
          </div>

          <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
            © 2026 LEVELUP SYSTEMS INC
          </div>
        </div>
      </footer>
    </div>
  );
}

function TestimonialCard({ name, role, content, avatar }: { name: string, role: string, content: string, avatar: string }) {
  return (
    <div className="p-12 rounded-[3.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-700 group">
      <div className="flex gap-1.5 mb-10">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="text-zinc-600 mb-10 leading-relaxed font-medium text-lg italic">"{content}"</p>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-zinc-50 border border-zinc-100 group-hover:rotate-6 transition-transform duration-500">
          <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h4 className="font-bold text-zinc-950 text-xl">{name}</h4>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{role}</p>
        </div>
      </div>
    </div>
  );
}
