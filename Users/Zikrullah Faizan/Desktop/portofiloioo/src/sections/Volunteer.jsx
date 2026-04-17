import React from 'react';
import { motion } from 'framer-motion';

const volunteer = [
  { title: 'STEM Events', desc: 'Organized and volunteered at STEM outreach events for students.', img: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80' },
  { title: 'E-ProTech Club', desc: 'Led and participated in club activities focused on tech education.', img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80' },
  { title: 'Community Work', desc: 'Contributed to local community projects and tech workshops.', img: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80' },
];

const Volunteer = () => (
  <section className="section" id="volunteer">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Volunteer Work</motion.h2>
      <div className="row justify-content-center">
        {volunteer.map((v, i) => (
          <div className="col-md-4 mb-4" key={i}>
            <motion.div className="glass p-4 h-100 d-flex flex-column justify-content-center align-items-center" whileHover={{ scale: 1.04 }} style={{ background: '#fff', border: '1px solid #e3e8f0' }}>
              <img src={v.img} alt={v.title} style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 10, marginBottom: 14, border: '2px solid #2a3a5e' }} />
              <div className="fw-bold mb-2 gradient-text text-center" style={{ fontSize: 17 }}>{v.title}</div>
              <div className="text-center" style={{ color: '#23234f' }}>{v.desc}</div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Volunteer;
