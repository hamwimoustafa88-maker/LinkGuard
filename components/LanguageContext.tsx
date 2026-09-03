'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, Direction } from '@/utils/translations';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar');
    const [direction, setDirection] = useState<Direction>('rtl');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load preference from local storage
        const savedLang = localStorage.getItem('linkguard-lang') as Language;
        if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
            setLanguageState(savedLang);
            setDirection(savedLang === 'ar' ? 'rtl' : 'ltr');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('linkguard-lang', language);
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
        document.body.classList.remove('font-cairo', 'font-tajawal');
        document.body.classList.add(language === 'ar' ? 'font-cairo' : 'font-tajawal');
    }, [language, direction, mounted]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        setDirection(lang === 'ar' ? 'rtl' : 'ltr');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    const t = (key: string) => {
        // @ts-expect-error - key is a loosely-typed string here; see the typed-translations follow-up
        return translations[language][key] || key;
    };

    // Fix: Always render the Provider, even during SSR/Pre-rendering. 
    // The previous check for (!mounted) caused the Provider to be missing, throwing errors in children using useLanguage.
    // Initial render will use default 'ar', matching the server. Hydration will be fine.
    // Client-side effect will update to 'en' if saved in localStorage.


    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
