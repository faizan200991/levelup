import React from 'react';
import { motion } from 'framer-motion';

const certs = [
  { name: 'Aspire Leaders Program', org: 'Aspire Institute', year: 2025, img: 'https://placehold.co/200x140?text=Aspire' },
  { name: 'IELTS', org: 'British Council', year: 2024, img: 'https://placehold.co/200x140?text=IELTS' },
  { name: 'React Basics', org: 'Coursera', year: 2024, img: 'https://placehold.co/200x140?text=React' },
  { name: 'JavaScript', org: 'SoloLearn', year: 2023, img: 'https://placehold.co/200x140?text=JS' },
  { name: 'STEM Workshop', org: 'E-ProTech', year: 2023, img: 'https://placehold.co/200x140?text=STEM' },
];

const CertificatesGallery = () => (
  <section className="section" id="cert-gallery">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Certificates Gallery</motion.h2>
      <div className="row justify-content-center">
        {certs.map((c, i) => (
          <div className="col-6 col-md-4 col-lg-3 mb-4" key={i}>
            <motion.div className="glass p-2 h-100" whileHover={{ scale: 1.07 }}>
              <img src={c.img} alt={c.name} className="w-100 mb-2 rounded" style={{ maxHeight: 120, objectFit: 'cover' }} />
              <div className="fw-bold gradient-text">{c.name}</div>
              <div className="small mb-1">{c.org} &mdash; {c.year}</div>
              <div className="mt-2">
                <button className="btn btn-outline-info btn-sm w-100" disabled>Upload Photo/PDF (Coming Soon)</button>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default CertificatesGallery;
