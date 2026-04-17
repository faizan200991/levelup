
import React, { useState } from 'react';
import { FaBars, FaTimes, FaHome, FaUser, FaCode, FaCertificate, FaBriefcase, FaHandsHelping, FaEnvelope } from 'react-icons/fa';
import '../styles/Sidebar.css';

const navLinks = [
  { to: '#hero', label: 'Home', icon: <FaHome /> },
  { to: '#about', label: 'About', icon: <FaUser /> },
  { to: '#skills', label: 'Skills', icon: <FaCode /> },
  { to: '#projects', label: 'Projects', icon: <FaCode /> },
  { to: '#experience', label: 'Experience', icon: <FaBriefcase /> },
  { to: '#certifications', label: 'Certifications', icon: <FaCertificate /> },
  { to: '#volunteer', label: 'Volunteer', icon: <FaHandsHelping /> },
  { to: '#testimonials', label: 'Testimonials', icon: <FaUser /> },
  { to: '#contact', label: 'Contact', icon: <FaEnvelope /> },
];


const Sidebar = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className={`sidebar${open ? ' open' : ''}`} style={{ overflowY: 'auto', maxHeight: '100vh', background: '#f7f9fb', borderRight: '1px solid #e3e8f0', boxShadow: '2px 0 12px 0 rgba(31,38,135,0.04)' }}>
        <div className="sidebar-header fw-bold mb-4" style={{ color: '#2a3a5e', fontSize: 22 }}>Zikrullah Faizan</div>
        <ul className="sidebar-links list-unstyled">
          {navLinks.map((link, i) => (
            <li key={i}>
              <a href={link.to} onClick={() => setOpen(false)} style={{ color: '#23234f', fontWeight: 500, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.2s, color 0.2s' }}>
                {link.icon} <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button className="sidebar-toggle btn btn-outline-info d-md-none" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <FaTimes /> : <FaBars />}
      </button>
    </>
  );
};

export default Sidebar;
