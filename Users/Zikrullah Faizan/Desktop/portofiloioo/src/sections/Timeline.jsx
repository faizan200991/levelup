import React from 'react';
import { motion } from 'framer-motion';

const experiences = [
  { year: '2025', title: 'SoftNex Founder', desc: 'Founded a tech startup focused on web solutions and digital education.' },
  { year: '2024', title: 'ESL Instructor', desc: 'Taught English as a Second Language to university students, improving communication and tech skills.' },
  { year: '2024', title: 'Club Leader', desc: 'Led E-ProTech club activities, workshops, and tech events.' },
  { year: '2023', title: 'Biology Teacher', desc: 'Developed engaging STEM lessons and led science projects.' },
  { year: '2022', title: 'IT/Slide Controller', desc: 'Managed event tech and presentations for large audiences.' },
];

const timelineVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.2 } }),
};

const Timeline = () => (
  <section className="section" id="timeline">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Experience Timeline</motion.h2>
      <div className="timeline-list position-relative" style={{ maxWidth: 700, margin: '0 auto' }}>
        {experiences.map((exp, i) => (
          <motion.div
            className="glass p-4 mb-4 timeline-item"
            key={i}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={timelineVariants}
            style={{ borderLeft: '4px solid #6c63ff', position: 'relative' }}
          >
            <div className="fw-bold gradient-text mb-1">{exp.title}</div>
            <div className="small mb-2" style={{ color: '#b3baff' }}>{exp.year}</div>
            <div>{exp.desc}</div>
            <span style={{ position: 'absolute', left: -14, top: 24, width: 16, height: 16, background: '#6c63ff', borderRadius: '50%', border: '2px solid #fff' }}></span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Timeline;
