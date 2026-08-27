# LEVELUP | The Ultra-High Performance Coding Classroom 🚀

**LEVELUP** is a next-generation engineering education platform designed to bridge the gap between "tutorial hell" and professional mastery. It provides a real-time, consolidated environment where students and teachers collaborate on code, augmented by intelligent AI guidance from Google Gemini and a robust real-time backend powered by Supabase.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18 or later
*   A free [Supabase](https://supabase.com) account and project
*   A [Google Gemini API key](https://ai.google.dev/)

### Installation
```bash
git clone <this-repository-url>
cd levelup
npm install
```

### Configuration
1. Copy the example environment file: `cp .env.example .env`
2. In your Supabase project dashboard, go to **Settings → API** and copy your Project URL and anon/public key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Add your Gemini API key to `GEMINI_API_KEY` and `VITE_GEMINI_API_KEY`.
4. In the Supabase SQL Editor, run the full contents of `supabase_schema.sql` to create all tables, RLS policies, and triggers.

### Running Locally
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Building for Production
```bash
npm run build
npm run start
```

### Keeping the Database Alive
See [Keeping the Database Alive](#-keeping-the-database-alive-supabase-free-tier) below to enable the included keep-alive GitHub Action.

## 🔴 The Problem: Fragmented Learning
Traditional coding education suffers from **Cognitive Load Overload**. Students typically juggle:
1.  **Teacher's Screen Share:** (Zoom/Meet, often laggy or low res)
2.  **Local IDE:** (VS Code/IntelliJ, often configured differently)
3.  **Documentation:** (Endless browser tabs)
4.  **Communication:** (Discord/Slack/Email for feedback)

This context-switching friction destroys the "flow state" and makes it nearly impossible for teachers to provide the immediate, tactical feedback that prevents students from getting permanently stuck.

## 🟢 The Solution: The Unified Workspace
LEVELUP solves this by creating a **Single Source of Truth**. By consolidating live demonstrations, structured assignments, a real-time editor, social learning, and AI-powered tutoring into one high-performance interface, we eliminate the friction of modern learning.

---

## ⚡ Core Features (What Makes it Different)

### 1. Real-Time Peer Hub (Momentum)
A social-engineering ecosystem where students share progress, milestones, and "momentum" updates.
*   **Discovery Mode:** Search and connect with fellow engineers across the globe.
*   **Engagement:** Like, comment, and follow peers to build a professional learning network.
*   **Authentic Profiles:** No generic placeholders. Every profile is a clean slate, built as the student grows.

### 2. Multi-Channel Notification System
Stay in the loop without checking 5 different apps.
*   **Instant Alerts:** Real-time push notifications for follows, likes, and comments.
*   **Teacher Feedback:** Immediate alerts when an assignment is graded or marked for review.
*   **Global Hub:** A dedicated activity feed to track your professional growth trajectory.

### 3. AI-Powered "Guided Discovery" Tutor
Integrated with **Google Gemini (3-Flash)** to act as a mentor, not a cheat sheet.
*   **Logic Hints:** The AI is programmed to identify logic errors and provide hints that lead students to the answer, rather than just providing the code.
*   **Context-Aware:** Analyzes the specific assignment requirements and the student's current code buffer.

### 4. Professional High-Density UI
Designed for engineers by engineers.
*   **Compact Architecture:** Optimized font scales and reduced padding ensure maximum information density without visual clutter.
*   **Focus Mode:** A single-click toggle to collapse non-essential UI, expanding the editor for deep-work sessions.
*   **Fluid Animations:** Powered by Framer Motion for hardware-accelerated transitions that feel like a desktop app.

---

## 🛠 Technical Architecture & Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | UI management with strict type safety for complex entities. |
| **Styling** | Tailwind CSS v4 | Utility-first styling for a "technical" and consistent aesthetic. |
| **Backend** | Supabase (PostgreSQL) | Auth, Database, and Real-time row-level subscriptions. |
| **Real-Time** | Supabase Realtime | Instant synchronization of notifications and social activity. |
| **AI Engine** | Google Gemini API | Logic-based tutoring and smart hints via `@google/generai`. |
| **Motion** | Framer Motion | Fluid route transitions and sidebar layout animations. |
| **Icons** | Lucide React | Professional, high-density iconography. |

---

## 🔄 User Journey: From Zeros to Heroes

### The Student Journey
Students land on a consolidated dashboard showing their current class status and active missions. They can enter the **Peer Hub** to see what their classmates are building, follow mentors, and get "momentum" from likes on their updates. When it's time to code, they enter the **Classroom**, where a live-synced editor and Gemini-powered tutor help them navigate complex technical challenges.

### The Teacher Journey
As classroom administrators, teachers deploy assignments with specific technical requirements and resources. They have a **Live Roster View** where they can see student submissions manifest in real-time. They can provide granular feedback, moving assignments between "Needs Review" and "Completed" states, which triggers instant notifications to the students.

---

## ⚙️ Deep Dive: Technical Implementation

### Real-Time Notification Logic
We leverage **Supabase `postgres_changes`** subscriptions to build a non-polling notification system.
```typescript
// Subscription logic in NotificationPopover.tsx
const channel = supabase
  .channel(`notifications:${user.id}`)
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications',
    filter: `user_id=eq.${user.id}` 
  }, (payload) => {
    // Immediate UI update without refresh
    setNotifications(prev => [payload.new, ...prev]);
    setUnreadCount(prev => prev + 1);
  })
  .subscribe();
```

### High-Density Design System
We moved away from the "standard" 16px font-size defaults. By utilizing a **12px-14px primary scale** with tight letter spacing and zinc-based neutrals, we've created a UI that feels like a professional IDE. This maximizes the screen real estate available for code and documentation.

---

## 🔒 Security Model

All tables use Postgres Row Level Security (RLS). Notably:

*   **No open write policies.** Actions with side effects on other users' data (liking a post, notifying a user) go through `SECURITY DEFINER` RPC functions or database triggers (`increment_post_likes`, `notify_on_post_like`, `notify_on_comment`, `notify_on_follow`) rather than permissive `USING (true)` policies, so a client can only ever mutate exactly what the function allows — not arbitrary columns or rows.
*   **Live session isolation.** `live_sessions` (a student's real-time code buffer) is only readable by the student who owns it or the teacher of that specific classroom — not by any other authenticated user.
*   **Scoped notifications.** Notifications can only be inserted by a party with a real teacher↔student relationship in a shared classroom (or automatically via trigger for social actions), preventing notification spoofing/spam.

## ⏱ Keeping the Database Alive (Supabase Free Tier)

Supabase's free tier pauses a project after 7 days with no database activity. This repo includes `.github/workflows/keep-alive.yml`, a scheduled GitHub Action that pings the Supabase REST API twice a week to reset the inactivity timer — no paid plan required. To enable it, add these two repository secrets under **Settings → Secrets and variables → Actions**:

*   `SUPABASE_URL`
*   `SUPABASE_ANON_KEY`

## 🎓 Technical Interview Prep (Q&A)

### Q1: How do you handle real-time state without overloading the client?
**Answer:** "We use Supabase Realtime which utilizes WebSockets. Instead of the client polling the database every few seconds (O(n) complexity), the server pushes only relevant delta changes to the specific user channel. This ensures that a student with 100+ notifications only receives the one they need, keeping memory usage low."

### Q2: Why Framer Motion for the Focus Mode?
**Answer:** "CSS transitions often trigger layout 'snapping' because they don't know about the final geometry of child elements. Framer Motion's `layout` prop uses the FLIP (First, Last, Invert, Play) technique, calculating the delta in milliseconds and applying hardware-accelerated transforms. This results in a 60fps expansion of the code editor that feels native."

### Q3: How is the AI Tutor's 'Non-Cheating' behavior enforced?
**Answer:** "System prompting. We pass a 'System Instruction' to the Gemini-3-Flash model stating: 'You are a master technical mentor. Your goal is to guide students to an answer by identifying the logical flaw in their code. NEVER provide the full solution block.' This ensures the pedagogic value is preserved."

---

## 📈 Social Impact: LinkedIn Draft

**Headline: Why I built LEVELUP: Fixing the "Copy-Paste" Education Crisis 🚀**

I’m thrilled to introduce **LEVELUP**, a platform I’ve been developing to transform how we teach engineering. 💻

Modern coding education is broken. We watch a video, we copy a tutorial, we get stuck on a typo, and we quit. I wanted to build something that feels like the cockpit of a high-performance jet, not a slow-moving classroom.

**Key Innovations:**
✅ **Real-Time Synergy:** Teacher feedback, peer momentum, and notifications happen INSTANTLY via Supabase.
✅ **AI Mentorship:** Integrated Gemini-3-Flash moves students from frustration to "Aha!" moments by explaining logic, not just fixing bugs.
✅ **Engineering-First UI:** A high-density, compact workspace designed for serious engineering.
✅ **Community Hub:** Follow peers, share momentum, and build your network while you learn.

We aren't just teaching syntax; we're building the next generation of engineers. 

Check out the evolution here: [Insert Link]

#EdTech #Engineering #ReactJS #Supabase #AI #Gemini #WebDevelopment #TypeScript #FutureOfLearning

---

Developed with ⚡ to help students learn faster and get hired.
// force vercel rebuild 
// fix vercel trigger 
// trigger vercel redeploy 
