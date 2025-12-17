'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageProvider';

export const useDictionary = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useDictionary must be used within a LanguageProvider');
  }
  return context.dictionary;
};
