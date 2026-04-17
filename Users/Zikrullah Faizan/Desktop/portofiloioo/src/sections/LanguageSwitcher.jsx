import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Malay' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {languages.map(l => (
        <button
          key={l.code}
          className={`btn btn-sm ${lang === l.code ? 'btn-info text-dark' : 'btn-outline-info'}`}
          onClick={() => setLang(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
