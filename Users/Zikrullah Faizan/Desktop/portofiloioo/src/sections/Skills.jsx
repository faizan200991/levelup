import React from 'react';
import { motion } from 'framer-motion';

import { FaHtml5, FaCss3Alt, FaJs, FaBootstrap, FaReact, FaNodeJs, FaPython, FaJava, FaPhp, FaDatabase, FaAws, FaCloud, FaGitAlt, FaGithub, FaFigma, FaDocker, FaLinux, FaCuttlefish, FaCogs, FaCloudUploadAlt, FaTools, FaCode } from 'react-icons/fa';

const programming = [
  { name: 'Python', icon: <FaPython color="#3776AB" />, level: 90 },
  { name: 'JavaScript', icon: <FaJs color="#f7df1e" />, level: 85 },
  { name: 'Java', icon: <FaJava color="#007396" />, level: 80 },
  { name: 'PHP', icon: <FaPhp color="#777bb4" />, level: 75 },
  { name: 'C/C++', icon: <FaCuttlefish color="#00599C" />, level: 70 },
];

const technology = [
  { name: 'React', icon: <FaReact color="#61dafb" />, level: 90 },
  { name: 'HTML', icon: <FaHtml5 color="#e44d26" />, level: 95 },
  { name: 'CSS', icon: <FaCss3Alt color="#1572b6" />, level: 90 },
  { name: 'Bootstrap', icon: <FaBootstrap color="#7952b3" />, level: 85 },
  { name: 'Node.js', icon: <FaNodeJs color="#68a063" />, level: 70 },
];

const databases = [
  { name: 'MySQL', icon: <FaDatabase color="#4479A1" />, level: 85 },
  { name: 'PostgreSQL', icon: <FaDatabase color="#336791" />, level: 75 },
  { name: 'MongoDB', icon: <FaDatabase color="#47A248" />, level: 70 },
  { name: 'Firebase', icon: <FaCloudUploadAlt color="#FFA000" />, level: 80 },
  { name: 'SQLite', icon: <FaDatabase color="#003B57" />, level: 65 },
];

const tools = [
  { name: 'Git', icon: <FaGitAlt color="#F05032" />, level: 85 },
  { name: 'GitHub', icon: <FaGithub color="#181717" />, level: 85 },
  { name: 'Figma', icon: <FaFigma color="#A259FF" />, level: 70 },
  { name: 'Docker', icon: <FaDocker color="#2496ED" />, level: 60 },
  { name: 'VS Code', icon: <FaCode color="#007ACC" />, level: 80 },
];

const SkillBar = ({ icon, name, level }) => (
  <div className="mb-3">
    <div className="d-flex align-items-center mb-1">
      <span className="me-2" style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ minWidth: 100 }}>{name}</span>
      <span className="ms-auto">{level}%</span>
    </div>
    <div className="progress" style={{ height: 8 }}>
      <div className="progress-bar bg-info" role="progressbar" style={{ width: `${level}%` }}></div>
    </div>
  </div>
);

const Skills = () => (
  <section className="section" id="skills">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Skills</motion.h2>
      <div className="row">
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="glass p-4 h-100">
            <h4 className="mb-3">Programming Languages</h4>
            {programming.slice(0, 5).map((s, i) => <SkillBar key={i} {...s} />)}
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="glass p-4 h-100">
            <h4 className="mb-3">Technology</h4>
            {technology.slice(0, 5).map((s, i) => <SkillBar key={i} {...s} />)}
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="glass p-4 h-100">
            <h4 className="mb-3">Databases</h4>
            {databases.slice(0, 5).map((s, i) => <SkillBar key={i} {...s} />)}
          </div>
        </div>
        <div className="col-md-6 col-lg-4 mb-4">
          <div className="glass p-4 h-100">
            <h4 className="mb-3">Tools</h4>
            {tools.slice(0, 5).map((s, i) => <SkillBar key={i} {...s} />)}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Skills;
