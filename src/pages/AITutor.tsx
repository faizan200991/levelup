import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Sparkles, Send, Bot, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../hooks/useAuth';

interface Message {
  role: 'user' | 'model';
  text: string;
}

import { cn } from '../lib/utils';

export default function AITutor() {
  const { profile } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Hello ${profile?.name || 'there'}! I'm your LEVELUP AI Tutor. I can help you with coding logic, debugging, or explaining complex technical concepts. What's on your mind today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const messageText = (overrideText ?? input).trim();
    if (!messageText || isLoading) return;

    const userMsg = messageText;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text: userMsg }]
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'missing_api_key') {
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              text: "### ⚠️ Google Gemini API Key Required\n\nIt looks like your deployment is missing the **`GEMINI_API_KEY`** or **`VITE_GEMINI_API_KEY`** environment variable!\n\nTo activate your AI Tutor, follow these quick steps:\n\n1. Get a free API key from [Google AI Studio](https://aistudio.google.com).\n2. Navigate to your project on the **Vercel Dashboard**.\n3. Go to **Settings ➔ Environment Variables**.\n4. Add a variable named **`GEMINI_API_KEY`** with your new key.\n5. Click **Redeploy** on your latest deployment on Vercel."
            }
          ]);
          return;
        }
        throw new Error(errData.message || 'API failed');
      }

      const data = await response.json();
      const aiText = data.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, I hit a snag. Please check your connection or try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] border border-zinc-200 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-xl shadow-lg shadow-zinc-200">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">AI Coding Tutor</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.1em]">Ready to assist</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages([messages[0]])} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 py-1.5">
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear Chat
          </Button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-10 space-y-10 scroll-smooth bg-linear-to-b from-white to-zinc-50/30"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex items-start gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105",
                  msg.role === 'model' ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-500"
                )}>
                  {msg.role === 'model' ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-5 rounded-[2rem] text-sm leading-relaxed max-w-[75%] shadow-xs",
                  msg.role === 'model' 
                    ? "bg-white border border-zinc-100 text-zinc-800 rounded-tl-none" 
                    : "bg-zinc-900 text-white rounded-tr-none shadow-lg shadow-zinc-200"
                )}>
                  {msg.role === 'model' ? (
                    <div className="prose prose-sm max-w-none prose-zinc prose-headings:font-display prose-headings:font-bold prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 1 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pl-14 flex flex-wrap gap-2"
            >
              {[
                "Why is my loop infinite?",
                "Explain recursion like I'm new to it",
                "My code runs but gives the wrong output",
                "What's the difference between a list and a tuple?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs font-medium px-4 py-2 rounded-full border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 hover:shadow-sm transition-all"
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}
          
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="p-5 rounded-[2rem] bg-white border border-zinc-100 rounded-tl-none shadow-xs">
                <div className="flex gap-1.5 px-2">
                  <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-6 border-t border-zinc-100 bg-white shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3 max-w-4xl mx-auto"
          >
            <div className="flex-1 relative">
              <Input 
                placeholder="Ask anything about coding..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-14 pl-6 pr-12 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all shadow-inner text-sm"
                disabled={isLoading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <MessageSquare className="w-4 h-4 text-zinc-300" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="h-14 px-8 rounded-2xl shadow-xl shadow-zinc-100 ring-4 ring-white"
              isLoading={isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px bg-zinc-50 flex-1" />
            <p className="text-[9px] text-zinc-300 uppercase font-bold tracking-[0.2em] whitespace-nowrap">
              Powered by Google Gemini
            </p>
            <div className="h-px bg-zinc-50 flex-1" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


