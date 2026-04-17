import React from 'react';
import { motion } from 'framer-motion';

import { FaGithub, FaGoogle, FaMedium, FaArrowDown } from 'react-icons/fa';

const profileUrl = 'https://randomuser.me/api/portraits/men/32.jpg'; // Online profile photo demo

const heroVariants = {
  hidden: { opacity: 0, y: -60 },
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

const textVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 1 } },
};

const Hero = () => (
  <section className="section d-flex flex-column align-items-center justify-content-center text-center" id="hero" style={{ minHeight: '100vh', position: 'relative' }}>
    <motion.div
      className="glass p-4 mb-3"
      variants={heroVariants}
      initial="hidden"
      animate="visible"
      style={{ borderRadius: 20, background: '#fff', border: '1px solid #e3e8f0', boxShadow: '0 2px 16px 0 rgba(31,38,135,0.07)' }}
    >
      <img
        src={profileUrl}
        alt="Zikrullah Faizan"
        className="rounded-circle mb-3"
        style={{ width: 130, height: 130, objectFit: 'cover', border: '3px solid #2a3a5e', boxShadow: '0 0 12px #2a3a5e22' }}
      />
      <motion.h1 className="gradient-text mb-2" style={{ fontSize: '2.2rem', fontWeight: 700 }} variants={textVariants}>
        Zikrullah Faizan
      </motion.h1>
      <motion.h2 className="mb-3" style={{ fontWeight: 500, fontSize: '1.15rem', color: '#2a3a5e' }} variants={textVariants}>
        Computer Science Student & Aspiring Software Engineer
      </motion.h2>
      <motion.p className="mb-3" style={{ fontSize: '1.05rem', color: '#23234f', maxWidth: 480, margin: '0 auto' }} variants={textVariants}>
        Dedicated to building robust, user-focused web applications and digital solutions. Experienced in full-stack development, project leadership, and cross-functional teamwork. Committed to continuous learning and delivering value through technology.
      </motion.p>
      <div className="d-flex justify-content-center mb-2 gap-3 flex-wrap">
        <a href="https://github.com/faizan200991" className="btn btn-github btn-sm" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FaGithub />
        </a>
        <a href="mailto:zikrullahk96@gmail.com" className="btn btn-outline-info btn-sm" target="_blank" rel="noopener noreferrer" aria-label="Gmail">
          <FaGoogle />
        </a>
        <a href="https://medium.com/@zikrullahfaizan" className="btn btn-outline-info btn-sm" target="_blank" rel="noopener noreferrer" aria-label="Medium">
          <FaMedium />
        </a>
      </div>
    </motion.div>
    <motion.div
      className="d-flex flex-column align-items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 1 }}
      style={{ position: 'absolute', bottom: 32, left: 0, right: 0 }}
    >
      <span style={{ color: '#2a3a5e', fontWeight: 500 }}>Scroll Down</span>
      <FaArrowDown color="#2a3a5e" size={24} className="mt-1" />
    </motion.div>
  </section>
);

export default Hero;
