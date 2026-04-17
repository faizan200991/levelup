import React from 'react';
import { FaGithub, FaTrophy, FaCodeBranch } from 'react-icons/fa';
import { motion } from 'framer-motion';

const stats = [
  { label: 'GitHub Stars', value: 120, icon: <FaGithub color="#f3f3f3" /> },
  { label: 'Projects', value: 12, icon: <FaTrophy color="#6c63ff" /> },
  { label: 'Lines of Code', value: '50k+', icon: <FaCodeBranch color="#00e6ff" /> },
  { label: 'Awards', value: 3, icon: <FaTrophy color="#ffd700" /> },
];

const badges = [
  { name: 'Hackathon Winner', color: '#6c63ff' },
  { name: 'Top Student', color: '#00e6ff' },
  { name: 'Open Source', color: '#ffd700' },
];

const LiveStats = () => (
  <section className="section" id="stats">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Live Stats & Achievements</motion.h2>
      <div className="row mb-4 justify-content-center">
        {stats.map((s, i) => (
          <div className="col-6 col-md-3 mb-4" key={i}>
            <motion.div className="glass p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center" whileHover={{ scale: 1.08 }} style={{ borderTop: '4px solid #6c63ff', background: 'rgba(30,30,60,0.92)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
              <div className="fw-bold gradient-text" style={{ fontSize: 28 }}>{s.value}</div>
              <div className="small" style={{ color: '#b3baff' }}>{s.label}</div>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="d-flex flex-wrap gap-3 justify-content-center mt-3">
        {badges.map((b, i) => (
          <span key={i} className="badge" style={{ background: b.color, color: '#181824', fontWeight: 700, fontSize: 17, padding: '0.8em 1.4em', borderRadius: 16, boxShadow: '0 2px 8px #0002' }}>{b.name}</span>
        ))}
      </div>
    </div>
  </section>
);

// Removed as per user request
