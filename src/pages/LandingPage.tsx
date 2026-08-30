import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { 
  Code2, 
  Users, 
  Zap, 
  Monitor, 
  MessageSquare, 
  Star,
  ChevronDown,
  Instagram,
  Facebook,
  Github,
  Twitter,
  ArrowUp,
} from 'lucide-react';

const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=2000"
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg md:text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown className="w-6 h-6 text-zinc-400 group-hover:text-blue-600 transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-zinc-500 text-sm md:text-base font-medium leading-relaxed max-w-2xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "Do I need to install anything?",
      answer: "No. LEVELUP runs entirely in your browser. Our high-frequency synchronization engine handles everything server-side, so you can start coding instantly on any device without setting up a local environment."
    },
    {
      question: "Which languages are supported?",
      answer: "We currently support JavaScript, TypeScript, Python, and C++. Our team is actively working on expanding the classroom mesh to include Ruby, Rust, and Go in the near future."
    },
    {
      question: "Is it really free for individuals?",
      answer: "Yes! LEVELUP is 100% free for individual students and independent teachers. We believe high-quality technical education should be accessible to everyone, regardless of their budget."
    },
    {
      question: "How does the AI Tutoring work?",
      answer: "Our AI Tutor utilizes the Gemini API to analyze your specific coding challenges. Instead of giving you the solution, it provides intelligent hints and guided questions to help you arrive at the answer yourself."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-10 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
            Common Questions
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-6 font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-500 font-medium text-lg">Everything you need to know before joining the classroom.</p>
        </div>
        <div className="bg-zinc-50/50 rounded-[3rem] p-8 md:p-12 border border-zinc-100">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Teacher Deployment",
      desc: "Educators push missions to the classroom mesh instantly.",
      icon: <Monitor className="w-6 h-6 text-blue-600" />,
      color: "blue"
    },
    {
      title: "Student Mesh",
      desc: "Every keystroke is synchronized across the high-frequency network.",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      color: "purple"
    },
    {
      title: "AI Review",
      desc: "Gemini analyzes logic flow and provides contextual hints.",
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      color: "emerald"
    }
  ];

  return (
    <section className="py-24 px-6 md:px-10 bg-zinc-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
           <span className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">The Architecture</span>
           <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-950 mt-4 leading-none">How It Works</h2>
        </div>
        
        <div className="relative">
          {/* Connecting lines for desktop */}
          <div className="hidden lg:block absolute top-[40px] left-[15%] w-[70%] h-px bg-zinc-200 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:scale-110 transition-transform duration-500">
                  {step.icon}
                </div>
                <div className="bg-white p-2 rounded-full border border-zinc-100 px-4 mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Step 0{idx + 1}</div>
                <h3 className="text-2xl font-bold text-zinc-950 mb-4">{step.title}</h3>
                <p className="text-zinc-500 font-medium leading-relaxed max-w-[280px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


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
            className="w-full h-full object-cover brightness-[0.4]"
            referrerPolicy="no-referrer"
            alt="Collaborative Learning"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 flex items-center justify-center p-6 md:p-16 z-10">
        <div className="max-w-4xl text-center">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col items-center space-y-4 md:space-y-6"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-600 text-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20">
              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" /> Next-Gen Learning
            </div>
            <h1 className="text-white text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
              Interactive Classroom <br />
              <span className="text-blue-500">Experience</span>
            </h1>
            <p className="text-zinc-400 text-xs md:text-base font-medium leading-relaxed max-w-2xl px-4 md:px-0 opacity-90">
              Master modern software engineering with real-time feedback from high-performance mentors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center w-full max-w-xs sm:max-w-none">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-zinc-100 hover:text-blue-600 text-white h-12 md:h-14 px-8 md:px-12 rounded-2xl text-xs md:text-base font-semibold shadow-xl border-none transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-zinc-900 h-12 md:h-14 px-8 md:px-12 rounded-2xl text-xs md:text-base font-semibold border-none transition-all shadow-xl">
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

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 md:bottom-10 md:right-10 z-50 w-10 h-10 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer group hover:bg-blue-700 transition-colors duration-300"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function LandingPage() {
  const [showNavCTAs, setShowNavCTAs] = useState(false);

  useEffect(() => {
    const toggleNavCTAs = () => {
      // Reveal nav CTAs once the hero's own CTAs have scrolled out of view,
      // so there's never a moment with two duplicate CTA pairs on screen.
      setShowNavCTAs(window.pageYOffset > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", toggleNavCTAs);
    return () => window.removeEventListener("scroll", toggleNavCTAs);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">
      <ScrollToTop />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-2xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-950 p-1.5 rounded-xl shadow-xl shadow-zinc-200">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter text-black uppercase">LEVELUP</span>
          </div>
          <AnimatePresence>
            {showNavCTAs && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-4"
              >
                <Link to="/login" className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-200 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)] hover:bg-white transition-all transform hover:-translate-y-0.5">Sign In</Link>
                <Link to="/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 shadow-lg shadow-blue-100 font-bold border-none transition-all hover:scale-105">Get Started</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen w-full">
        <HeroCard />
      </section>

      {/* How it Works Visual */}
      <HowItWorks />

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
      
      {/* FAQ Section */}
      <FAQSection />


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
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white mb-10">
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


      <footer className="bg-zinc-950 pt-24 pb-12 text-zinc-400 border-t border-zinc-900 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl tracking-tighter uppercase text-white">LEVELUP</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
                High-frequency synchronization for modern technical education. Building the bridge between classroom theory and industrial practice.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-700 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Classrooms</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Real-time Sync</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">AI Tutoring</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Uptime/Nodes</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">Resources</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Curriculums</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-sm font-medium hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest w-full">
              © 2026 LEVELUP SYSTEMS INC • ALL RIGHTS RESERVED
            </div>
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
