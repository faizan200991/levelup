
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const certifications = [
  { name: 'Aspire Leaders Program', org: 'Aspire Institute', year: 2025, img: 'https://placehold.co/300x200?text=Aspire' },
  { name: 'IELTS', org: 'British Council', year: 2024, img: 'https://placehold.co/300x200?text=IELTS' },
  { name: 'React Basics', org: 'Coursera', year: 2024, img: 'https://placehold.co/300x200?text=React' },
  { name: 'JavaScript', org: 'SoloLearn', year: 2023, img: 'https://placehold.co/300x200?text=JS' },
  { name: 'STEM Workshop', org: 'E-ProTech', year: 2023, img: 'https://placehold.co/300x200?text=STEM' },
  { name: 'Leadership Training', org: 'AIU', year: 2024, img: 'https://placehold.co/300x200?text=Leader' },
];

const CertCard = ({ cert, onClick }) => (
  <motion.div className="glass p-3 mb-3 d-flex flex-column align-items-center justify-content-center" whileHover={{ scale: 1.04 }} style={{ cursor: 'pointer', minHeight: 220 }} onClick={onClick}>
    <img src={cert.img} alt={cert.name} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, marginBottom: 12, border: '2px solid #2a3a5e' }} />
    <div className="fw-bold gradient-text mb-1" style={{ fontSize: 17 }}>{cert.name}</div>
    <div className="small mb-1" style={{ color: '#2a3a5e' }}>{cert.org} &mdash; {cert.year}</div>
  </motion.div>
);

const CertModal = ({ cert, onClose }) => (
  <AnimatePresence>
    {cert && (
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,30,60,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div className="modal-content glass p-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ maxWidth: 420, width: '90%', borderRadius: 18, position: 'relative' }}>
          <button className="btn btn-close btn-sm" style={{ position: 'absolute', top: 12, right: 12 }} onClick={onClose}></button>
          <img src={cert.img} alt={cert.name} style={{ width: '100%', borderRadius: 12, marginBottom: 18, border: '2px solid #2a3a5e' }} />
          <h4 className="gradient-text mb-2 text-center">{cert.name}</h4>
          <div className="small mb-1 text-center" style={{ color: '#2a3a5e', fontWeight: 600 }}>{cert.org} &mdash; {cert.year}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Certifications = () => {
  const [modal, setModal] = useState(null);
  return (
    <section className="section" id="certifications">
      <div className="container">
        <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Certifications</motion.h2>
        <div className="row">
          {certifications.map((cert, i) => (
            <div className="col-md-4 mb-3" key={i}>
              <CertCard cert={cert} onClick={() => setModal(cert)} />
            </div>
          ))}
        </div>
        <CertModal cert={modal} onClose={() => setModal(null)} />
      </div>
    </section>
  );
};

export default Certifications;
