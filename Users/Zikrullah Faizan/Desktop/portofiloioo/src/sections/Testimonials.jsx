import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Dr. A. Rahman',
    role: 'Professor, AIU',
    text: 'Zikrullah is a dedicated and innovative developer. His passion for learning and teaching is inspiring.',
  },
  {
    name: 'Sarah Lim',
    role: 'Mentor, SoftNex',
    text: 'Working with Zikrullah was a pleasure. He brings creativity and professionalism to every project.',
  },
  {
    name: 'John Tan',
    role: 'Colleague',
    text: 'A great communicator and team player. Zikrullah brings energy and creativity to every project.',
  },
];

const Testimonials = () => (
  <section className="section" id="testimonials">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Testimonials</motion.h2>
      <div className="row justify-content-center">
        {testimonials.map((t, i) => (
          <div className="col-md-6 mb-4" key={i}>
            <motion.div className="glass p-4 h-100" whileHover={{ scale: 1.03 }}>
              <div className="mb-2" style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#b3baff' }}>
                “{t.text}”
              </div>
              <div className="fw-bold gradient-text mt-2">{t.name}</div>
              <div className="small">{t.role}</div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
