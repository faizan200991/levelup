import React from 'react';
import { motion } from 'framer-motion';
import { demoProfile } from '../assets/demo';

const About = () => (
  <section className="section d-flex flex-column align-items-center text-center" id="about">
    <motion.div className="glass p-5" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ maxWidth: 540, background: '#fff', border: '1px solid #e3e8f0' }}>
      <img src={demoProfile} alt="Profile" className="rounded-circle mb-3" style={{ width: 110, border: '3px solid #2a3a5e', boxShadow: '0 0 12px #2a3a5e22' }} />
      <h2 className="gradient-text mb-3">About Me</h2>
      <div className="mb-2" style={{ color: '#2a3a5e', fontWeight: 500, fontSize: 17 }}>Computer Science Student, Albukhary International University</div>
      <p style={{ color: '#23234f', fontSize: 16, marginBottom: 0 }}>
        I am passionate about developing robust web applications and digital solutions that solve real-world problems. My experience spans full-stack development, project leadership, and educational technology. I value teamwork, clear communication, and continuous growth.<br />
        <span style={{ color: '#2a3a5e', fontWeight: 600 }}>Let’s connect to create meaningful impact.</span>
      </p>
    </motion.div>
  </section>
);

export default About;
