import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const experiences = [
  { role: 'ESL Instructor', org: 'AIU', year: '2024', desc: 'Taught English as a Second Language to university students, improving communication and tech skills.', img: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=400&q=80' },
  { role: 'Biology Teacher', org: 'High School', year: '2023', desc: 'Developed engaging STEM lessons and led science projects.', img: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80' },
  { role: 'IT/Slide Controller', org: 'Events', year: '2022', desc: 'Managed event tech and presentations for large audiences.', img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80' },
  { role: 'SoftNex Founder', org: 'SoftNex', year: '2025', desc: 'Founded a tech startup focused on web solutions and digital education.', img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' },
  { role: 'Club Leader', org: 'E-ProTech', year: '2024', desc: 'Led club activities, workshops, and tech events.', img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80' },
];


const ExperienceCard = ({ role, org, year, desc, img, onClick }) => (
  <motion.div className="glass p-4 mb-4 d-flex flex-column align-items-center justify-content-center h-100" whileHover={{ scale: 1.04 }} style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 24px #6c63ff22', borderLeft: '6px solid #6c63ff', cursor: 'pointer' }} onClick={onClick}>
    <img src={img} alt={role} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 20, marginBottom: 18, border: '2px solid #6c63ff' }} />
    <div className="text-center">
      <div className="fw-bold gradient-text" style={{ fontSize: 20 }}>{role}</div>
      <div className="small mb-1" style={{ color: '#6c63ff', fontWeight: 600 }}>{org} &mdash; {year}</div>
      <div style={{ color: '#23234f', fontSize: 16 }}>{desc.slice(0, 60)}{desc.length > 60 ? '...' : ''}</div>
    </div>
  </motion.div>
);

const ExperienceModal = ({ exp, onClose }) => (
  <AnimatePresence>
    {exp && (
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,30,60,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div className="modal-content glass p-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ maxWidth: 400, width: '90%', borderRadius: 20, position: 'relative' }}>
          <button className="btn btn-close btn-sm" style={{ position: 'absolute', top: 12, right: 12 }} onClick={onClose}></button>
          <img src={exp.img} alt={exp.role} style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 24, marginBottom: 18, border: '2px solid #6c63ff', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <h4 className="gradient-text mb-2 text-center">{exp.role}</h4>
          <div className="small mb-1 text-center" style={{ color: '#6c63ff', fontWeight: 600 }}>{exp.org} &mdash; {exp.year}</div>
          <div className="mb-2 text-center" style={{ color: '#23234f', fontSize: 16 }}>{exp.desc}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


const Experience = () => {
  const [modal, setModal] = useState(null);
  return (
    <section className="section" id="experience">
      <div className="container">
        <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Experience & Leadership</motion.h2>
        <div className="row">
          {experiences.map((exp, i) => (
            <div className="col-md-4 mb-4" key={i}>
              <ExperienceCard {...exp} onClick={() => setModal(exp)} />
            </div>
          ))}
        </div>
        <ExperienceModal exp={modal} onClose={() => setModal(null)} />
      </div>
    </section>
  );
};

export default Experience;
