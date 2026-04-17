import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
const demoProjects = [
  {
    title: 'ERP System',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80',
    stack: ['React', 'Firebase', 'Bootstrap'],
    type: 'Web',
    description: 'A full-featured ERP for school management with real-time data and role-based dashboards.',
    details: 'This ERP system streamlines school operations, supports multiple user roles, and integrates real-time analytics. Built with React and Firebase.',
    screenshots: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80'],
    live: 'https://erp-demo.example.com',
    github: 'https://github.com/faizan200991/erp-system',
  },
  {
    title: 'E-commerce Site',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80',
    stack: ['React', 'Stripe', 'Bootstrap'],
    type: 'Web',
    description: 'Modern e-commerce platform with product filtering, cart, and secure checkout.',
    details: 'A responsive e-commerce site with Stripe integration, product search, and user authentication.',
    screenshots: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80'],
    live: 'https://ecommerce-demo.example.com',
    github: 'https://github.com/faizan200991/ecommerce-site',
  },
  {
    title: 'Portfolio',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    stack: ['React', 'Framer Motion', 'CSS'],
    type: 'Web',
    description: 'Personal portfolio with animated UI, glassmorphism, and smooth scroll.',
    details: 'Showcases projects, skills, and certifications with modern UI and animations.',
    screenshots: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
    live: 'https://portfolio-demo.example.com',
    github: 'https://github.com/faizan200991/portfolio',
  },
  {
    title: 'To-Do App',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    stack: ['React', 'Firebase'],
    type: 'App',
    description: 'Simple and fast to-do app with cloud sync and responsive design.',
    details: 'A productivity app with real-time sync and offline support.',
    screenshots: ['https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80'],
    live: 'https://todo-demo.example.com',
    github: 'https://github.com/faizan200991/todo-app',
  },
];

const types = ['All', ...Array.from(new Set(demoProjects.map(p => p.type)))];

const ProjectModal = ({ project, onClose }) => (
  <AnimatePresence>
    {project && (
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="modal-content glass p-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
          <button className="btn btn-close btn-sm float-end" onClick={onClose}></button>
          <h4 className="gradient-text mb-2">{project.title}</h4>
          <div className="mb-2">
            {project.stack.map((tech, i) => (
              <span key={i} className="badge bg-info text-dark me-1">{tech}</span>
            ))}
          </div>
          <div className="mb-3">{project.details}</div>
          <div className="mb-3 d-flex gap-2">
            {project.screenshots.map((img, i) => (
              <img key={i} src={img} alt="Screenshot" style={{ width: 100, borderRadius: 8 }} />
            ))}
          </div>
          <div className="d-flex gap-2">
            <a href={project.github} className="btn btn-outline-dark" target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
            <a href={project.live} className="btn btn-primary" target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> Live Demo</a>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Projects = () => {
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const filtered = filter === 'All' ? demoProjects : demoProjects.filter(p => p.type === filter);
  return (
    <section className="section" id="projects">
      <div className="container">
        <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Projects</motion.h2>
        <div className="mb-4 d-flex flex-wrap gap-2 justify-content-center">
          {types.map((t, i) => (
            <button key={i} className={`btn ${filter === t ? 'btn-info text-dark' : 'btn-outline-info'}`} onClick={() => setFilter(t)}>{t}</button>
          ))}
        </div>
        <div className="row">
          {filtered.map((p, i) => (
            <div className="col-md-6 col-lg-4 mb-4" key={i}>
              <motion.div className="glass p-3 h-100" whileHover={{ scale: 1.03 }} style={{ cursor: 'pointer' }} onClick={() => setModal(p)}>
                <img src={p.image} alt={p.title} className="w-100 mb-2 rounded" style={{ maxHeight: 160, objectFit: 'cover' }} />
                <h5 className="gradient-text mb-1">{p.title}</h5>
                <div className="mb-2">
                  {p.stack.map((tech, i) => (
                    <span key={i} className="badge bg-info text-dark me-1">{tech}</span>
                  ))}
                </div>
                <img src={p.image} alt={p.title} className="w-100 mb-2 rounded" style={{ maxHeight: 120, objectFit: 'cover' }} />
                <p style={{ minHeight: 48 }}>{p.description}</p>
                <div className="d-flex gap-2 mt-2">
                  <a href={p.github} className="btn btn-outline-dark btn-sm" target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
                  <a href={p.live} className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> Live Demo</a>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
        <ProjectModal project={modal} onClose={() => setModal(null)} />
      </div>
    </section>
  );
};

export default Projects;
