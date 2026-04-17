import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';


const Footer = () => (
  <>
    <div className="collab-banner py-4 mb-0" style={{ background: 'linear-gradient(90deg, #6c63ff 0%, #00e6ff 100%)', color: '#fff', fontWeight: 600, fontSize: 22, letterSpacing: 1, borderRadius: 0 }}>
      <span style={{ display: 'inline-block', marginRight: 12 }}>I'm always open to collaboration!</span>
      <span style={{ fontSize: 18 }}>Let's build something amazing together!</span>
    </div>
    <footer className="text-center py-4 mt-0">
      <div className="mb-2">
        <a href="https://github.com/faizan200991" className="me-3" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><FaGithub size={24} color="#f3f3f3" /></a>
        <a href="https://www.linkedin.com/in/zikrullah-faizan-a52757299" className="me-3" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedin size={24} color="#6c63ff" /></a>
        <a href="mailto:zikrullahk96@gmail.com" aria-label="Gmail" target="_blank" rel="noopener noreferrer"><FaTwitter size={24} color="#00e6ff" /></a>
      </div>
      <div className="small mb-1">&copy; {new Date().getFullYear()} Zikrullah Faizan. Built by Zikrullah Faizan.</div>
      <div className="mt-3" style={{ color: '#6c63ff', fontWeight: 600, fontSize: 18 }}>
        I'm also open for questions — let's build something amazing together!
      </div>
    </footer>
  </>
);

export default Footer;
