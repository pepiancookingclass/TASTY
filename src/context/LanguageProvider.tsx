'use client';

import React, { createContext, useState, ReactNode } from 'react';
import dictionaryEN from '@/dictionaries/en';
import dictionaryES from '@/dictionaries/es';

export type Language = 'en' | 'es';

const dictionaries = {
  en: dictionaryEN,
  es: dictionaryES,
};

type LanguageContextType = {
  language: Language;
  dictionary: typeof dictionaryES;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('es');

  const toggleLanguage = () => {
    setLanguage(prevLang => (prevLang === 'en' ? 'es' : 'en'));
  };

  const dictionary = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
};
