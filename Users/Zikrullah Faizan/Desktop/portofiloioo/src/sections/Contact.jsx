import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };
  return (
    <section className="section" id="contact">
      <div className="container">
        <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Contact</motion.h2>
        <div className="row align-items-stretch justify-content-center">
          <div className="col-md-6 mb-4 mb-md-0 d-flex flex-column">
            <motion.form className="glass p-4 h-100" onSubmit={handleSubmit} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows="4" required></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100">Send Message</button>
              {sent && <motion.div className="alert alert-success mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Message sent! (Demo only)</motion.div>}
            </motion.form>
          </div>
          <div className="col-md-1 d-none d-md-flex justify-content-center align-items-stretch">
            <div style={{ width: 2, background: '#e3e8f0', borderRadius: 1, minHeight: '100%' }}></div>
          </div>
          <div className="col-md-5 d-flex flex-column justify-content-between">
            <div className="glass p-4 mb-4 h-100 d-flex flex-column justify-content-center">
              <div className="mb-3">
                <strong>Phone:</strong> <span style={{ color: '#2a3a5e' }}>+60 12-345 6789</span>
              </div>
              <div className="mb-3">
                <strong>Email:</strong> <span style={{ color: '#2a3a5e' }}>zikrullahk96@gmail.com</span>
              </div>
              <div className="mb-3">
                <strong>Address:</strong> <span style={{ color: '#2a3a5e' }}>Albukhary International University, Alor Setar, Malaysia</span>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', minHeight: 180, boxShadow: '0 2px 12px #2a3a5e11' }}>
                <iframe
                  title="map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=100.369%2C6.124%2C100.371%2C6.126&amp;layer=mapnik"
                  style={{ width: '100%', height: 180, border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
