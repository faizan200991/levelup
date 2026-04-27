# LEVELUP [v5.0] // High-Frequency Sync Engine

LEVELUP is a high-performance synchronization layer designed for modern technical education. It transforms the traditional classroom into a bi-directional "coding mesh," where logic is broadcasted, monitored, and optimized in real-time.

The interface has been refined and simplified to maximize focus on the code and the connection.

---

## ⚡ Core Architecture

### 1. Identity & Node Initialization
- **Custom Identity Nodes**: Every participant (Teacher/Student) initializes with a unique profile, supporting direct visual recognition in the mesh.
- **Role-Based Protocols**: Hardened security boundaries between "Mentors" (Teachers) and "Nodes" (Students).

### 2. LEVELUP Terminal Sync
- **Pulse Broadcast**: Bi-directional code synchronization using Firebase Firestore real-time listeners.
- **Omniscient Monitoring**: Mentors can observe logic flow and provide instant surgical feedback.
- **Monaco Engine**: Industrial-grade code editing powered by the VS Code editor core.

### 3. Mission-Control Tasking
- **Deployment Queue**: Teachers deploy multiple "Mission Tasks" (Problems) to the mesh.
- **Task Tree Navigation**: Students navigate a unified queue of assigned challenges and resources.

---

## 🛠 Tech Stack

- **Framework**: React 18 + Vite (ESM)
- **Styling**: Tailwind CSS (Minimal, high-contrast aesthetic)
- **Animations**: Framer Motion (Smooth state transitions)
- **Database**: Firebase Firestore (Enterprise Tier)
- **Auth**: Firebase Authentication (Identity management)
- **AI**: Gemini Pro API (Intelligent tutoring)
- **Editor**: Monaco Editor

---

## 🚦 Deployment & Environment Setup

This application is designed to be hosted on platforms like **Netlify** or **Cloud Run**. To ensure full functionality, the following environment variables must be configured:

### Required Variables (Vite Prefixed)
These should be set in your hosting provider's dashboard:
- `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase Project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Messaging Sender ID.
- `VITE_FIREBASE_APP_ID`: Your Firebase App ID.
- `VITE_FIREBASE_DATABASE_ID`: (Optional) Your Firestore Database ID (defaults to `(default)`).
- `VITE_GEMINI_API_KEY`: Your Google Gemini API Key for AI features.

### Local Development
Copy `.env.example` to `.env` and fill in your credentials.

---
*Developed for elite technical educators and engineers of the future.*

