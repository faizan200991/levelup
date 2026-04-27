import React from 'react';
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
  FileText
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-2xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-950 p-1.5 rounded-xl shadow-xl shadow-zinc-200">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter text-zinc-950 uppercase">LEVEL<span className="text-zinc-400">UP</span></span>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-all">Sign In</Link>
            <Link to="/register">
              <Button size="sm" className="rounded-xl px-6 h-10 shadow-xl shadow-zinc-100 font-bold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-zinc-50 rounded-full blur-[150px] -mr-[20vw] -mt-[20vw] -z-10 opacity-50" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-2xl shadow-zinc-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> THE NEW CODE STANDARD
            </div>
            <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter text-zinc-950 leading-[0.8] mb-10">
              SYNCHRONIZE<br />
              <span className="text-zinc-400">YOUR</span> <br />
              GENIUS.
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed max-w-md mb-12 font-medium tracking-tight">
              The industry-standard synchronization layer for elite technical education. Broadcast logic, monitor terminal nodes, and scale engineer production in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl text-base font-bold bg-zinc-950 hover:bg-zinc-900 shadow-2xl shadow-zinc-200 group transition-all">
                  Initialize Network <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="perspective-2000 relative group"
          >
            <div className="relative rounded-[5rem] overflow-hidden shadow-[0_100px_200px_rgba(0,0,0,0.2)] border border-zinc-100 p-8 bg-white/90 backdrop-blur-3xl transform-gpu transition-all duration-1000 group-hover:rotate-1 group-hover:-translate-y-4">
               <div className="h-12 px-8 flex items-center justify-between border-b border-zinc-50 mb-8 font-mono text-[10px] text-zinc-400 uppercase tracking-widest font-black">
                  <span>mission_control.sync [v2.4.0]</span>
                  <div className="flex gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400/20" />
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20" />
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20" />
                  </div>
               </div>
               
               <div className="rounded-[4rem] overflow-hidden bg-[#0d0d0d] p-1.5 relative group-hover:shadow-[0_0_120px_rgba(0,0,0,0.1)] transition-all">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(50,50,50,0.1)_0%,transparent_50%)]" />
                
                <div className="h-[400px] font-mono p-12 overflow-hidden relative">
                   <div className="space-y-4">
                      <div className="flex gap-4">
                        <span className="text-zinc-800">01</span>
                        <span className="text-emerald-500">import</span>
                        <span className="text-white">{"{ MeshSync }"}</span>
                        <span className="text-emerald-500">from</span>
                        <span className="text-amber-500">'@levelup/core'</span>;
                      </div>
                      <div className="flex gap-4">
                        <span className="text-zinc-800">02</span>
                        <span className="text-zinc-500">{"// Initialize node broadcast"}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-zinc-800">03</span>
                        <span className="text-emerald-500">const</span>
                        <span className="text-blue-400">node</span>
                        <span className="text-white">=</span>
                        <span className="text-emerald-500">new</span>
                        <span className="text-white">MeshSync();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-zinc-800">04</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-zinc-800">05</span>
                        <span className="text-blue-400">node</span>.
                        <span className="text-white">broadcast((</span>
                        <span className="text-amber-400">signal</span>
                        <span className="text-white">) ={">"} {"{"}</span>
                      </div>
                      <div className="flex gap-4 pl-8">
                        <span className="text-zinc-800">06</span>
                        <span className="text-emerald-500">return</span>
                        <span className="text-amber-400">signal</span>.
                        <span className="text-white">optimize();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-zinc-800">07</span>
                        <span className="text-white">{"});"}</span>
                      </div>
                   </div>

                   {/* Floating Metrics */}
                   <div className="absolute top-12 right-12 space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em]"
                        >
                          Node_{i * 255}_Active
                        </motion.div>
                      ))}
                   </div>
                </div>
                
                <div className="absolute inset-0 p-16 flex flex-col pointer-events-none">
                   <div className="mt-auto">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 shadow-3xl"
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                 <Zap className="w-7 h-7 fill-zinc-950" />
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] leading-none mb-2">Live Sync Protocol</p>
                                 <p className="text-lg font-bold text-emerald-400">Grid Connectivity: 100%</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-mono text-zinc-300 uppercase">Latency</p>
                               <p className="text-xl font-bold font-mono text-white">4ms</p>
                            </div>
                         </div>
                      </motion.div>
                   </div>
                </div>
               </div>
            </div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-zinc-100 rounded-full mix-blend-multiply blur-3xl opacity-50 animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-50 rounded-full mix-blend-multiply blur-3xl opacity-50" />
          </motion.div>
        </div>
      </section>

      {/* Real-time Flow Section */}
      <section className="py-48 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8">
              THE <span className="text-zinc-700">FLOW</span> OF CODE.
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg font-medium">A seamless, bi-directional transmission layer that keeps teachers and students in perfect synchronization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Broadcast",
                desc: "Teachers push problems and resources to the mesh. Instant deployment across all student nodes.",
                image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
              },
              {
                step: "02",
                title: "Observe",
                desc: "Monitor student logic in real-time. Catch errors before they become habits with terminal sync.",
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"
              },
              {
                step: "03",
                title: "Optimize",
                desc: "Instant feedback loop. Grade, comment, and iterate with AI-assisted mentoring tools.",
                image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800"
              }
            ].map((node, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group p-10 rounded-[3rem] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-500 overflow-hidden"
              >
                <div className="text-5xl font-display font-black text-white/5 mb-8 group-hover:text-white/10 transition-colors uppercase tracking-widest">{node.step}</div>
                <div className="aspect-video rounded-3xl overflow-hidden mb-10 border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img src={node.image} alt={node.title} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{node.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-medium">{node.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-48 px-10 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
             <h2 className="font-display text-5xl font-bold tracking-tighter text-zinc-950 mb-6">TRUSTED BY <span className="text-zinc-400">EXPERTS.</span></h2>
             <p className="text-zinc-600 max-w-lg mx-auto font-medium">Leading technical directors and educators rely on LEVELUP for secure, scaleable training.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <TestimonialCard 
              name="Dr. Aris Thorne"
              role="Head of CS, Standard"
              content="The latency profile is unlike anything we've seen. It feels like teaching in the same room even across oceans."
              avatar="1"
            />
            <TestimonialCard 
              name="Sarah Jenkins"
              role="CTO, Tech Academy"
              content="Security was our main blocker. LevelUp's encrypted vault solved it overnight. Professional and performant."
              avatar="2"
            />
            <TestimonialCard 
              name="Marcus V."
              role="Product Lead, DevCorp"
              content="Training junior engineers has become 4x more efficient. The mesh chat allows for instant intervention."
              avatar="3"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-48 px-10 bg-white">
        <div className="max-w-7xl mx-auto rounded-[6rem] bg-zinc-950 p-24 md:p-48 text-center relative overflow-hidden shadow-[0_50px_200px_rgba(0,0,0,0.4)] group">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-white mb-10 leading-[0.85]">
              UPGRADE <br />
              <span className="text-zinc-700 group-hover:text-zinc-600 transition-colors duration-1000">YOUR SPECS.</span>
            </h2>
            <Link to="/register">
              <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-100 h-16 px-12 rounded-2xl text-xl font-bold shadow-2xl transition-all hover:scale-110 active:scale-95 duration-500">
                Initialize System
              </Button>
            </Link>
            <p className="mt-12 text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">VER_09.22.42-STABLE</p>
          </motion.div>
        </div>
      </section>

      <footer className="py-24 border-t border-zinc-100 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-zinc-950 p-1.5 rounded-xl">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tighter uppercase">LEVEL<span className="text-zinc-400">UP</span></span>
            </div>
            <p className="text-zinc-500 font-medium text-sm max-w-xs">Accelerating the transition to technical excellence across the global education stack.</p>
          </div>
          <div className="flex flex-wrap gap-20 md:justify-end">
            <div>
              <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-6">Network</p>
              <ul className="space-y-3 text-sm font-bold text-zinc-500">
                <li><a href="#" className="hover:text-zinc-950 transition-colors">Nodes</a></li>
                <li><a href="#" className="hover:text-zinc-950 transition-colors">Clusters</a></li>
                <li><a href="#" className="hover:text-zinc-950 transition-colors">Uptime</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-6">Legal</p>
              <ul className="space-y-3 text-sm font-bold text-zinc-500">
                <li><a href="#" className="hover:text-zinc-950 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-zinc-950 transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-6">Social</p>
              <ul className="space-y-3 text-sm font-bold text-zinc-500">
                <li><a href="#" className="hover:text-zinc-950 transition-colors">X / Twitter</a></li>
                <li><a href="#" className="hover:text-zinc-950 transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">
          © 2026 LEVELUP SYSTEMS INC // ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
}

function TestimonialCard({ name, role, content, avatar }: { name: string, role: string, content: string, avatar: string }) {
  return (
    <div className="p-12 rounded-[3.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-700 group">
      <div className="flex gap-1 mb-10">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-zinc-900 text-zinc-900" />)}
      </div>
      <p className="text-zinc-600 mb-10 leading-relaxed font-medium text-lg">"{content}"</p>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-zinc-50 border border-zinc-100 group-hover:rotate-6 transition-transform duration-500">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`} alt={name} referrerPolicy="no-referrer" />
        </div>
        <div>
          <h4 className="font-bold text-zinc-950 text-xl">{name}</h4>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{role}</p>
        </div>
      </div>
    </div>
  );
}
