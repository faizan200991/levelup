import Hero from './sections/Hero';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Certifications from './sections/Certifications';
import Experience from './sections/Experience';
import Volunteer from './sections/Volunteer';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import Sidebar from './components/Sidebar';
import './styles/Sidebar.css';
import Testimonials from './sections/Testimonials';
import ThemeToggle from './components/ThemeToggle';
import LanguageSwitcher, { LanguageProvider } from './sections/LanguageSwitcher';
import Timeline from './sections/Timeline';


function App() {
  return (
    <LanguageProvider>
      <Sidebar />
      <div className="main-content" style={{ maxWidth: 1200, margin: '0 auto', paddingLeft: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 0 0' }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Certifications />
        <Volunteer />
        <Testimonials />
        <Contact />
        <Footer />
        {/* Optional/extra sections */}
      </div>
    </LanguageProvider>
  );
}

export default App;
