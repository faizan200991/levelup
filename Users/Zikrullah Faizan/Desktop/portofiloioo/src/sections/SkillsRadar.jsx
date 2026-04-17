import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const data = {
  labels: ['HTML', 'CSS', 'JavaScript', 'Bootstrap', 'UI/UX', 'Firebase'],
  datasets: [
    {
      label: 'Skill Level',
      data: [90, 85, 80, 80, 75, 70],
      backgroundColor: 'rgba(108,99,255,0.2)',
      borderColor: '#6c63ff',
      borderWidth: 2,
      pointBackgroundColor: '#00e6ff',
    },
  ],
};

const options = {
  scales: {
    r: {
      angleLines: { display: true },
      suggestedMin: 0,
      suggestedMax: 100,
      pointLabels: { color: '#b3baff', font: { size: 16 } },
      grid: { color: '#23234f' },
      ticks: { color: '#e0e0e0', stepSize: 20 },
    },
  },
  plugins: {
    legend: { display: false },
  },
  responsive: true,
};

const SkillsRadar = () => (
  <section className="section" id="skills-visual">
    <div className="container">
      <motion.h2 className="gradient-text text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>Skills Visualization</motion.h2>
      <div className="d-flex justify-content-center">
        <div className="glass p-4" style={{ maxWidth: 500, width: '100%' }}>
          <Radar data={data} options={options} />
        </div>
      </div>
    </div>
  </section>
);

export default SkillsRadar;
