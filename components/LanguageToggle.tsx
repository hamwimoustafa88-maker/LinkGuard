'use client';

import { useLanguage } from './LanguageContext';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
    const { language, toggleLanguage } = useLanguage();

    return (
        <motion.button
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-navy/50 hover:bg-cyber-navy border border-cyber-glow/30 rounded-full text-cyber-glow transition-all"
        >
            <Globe className="w-4 h-4" />
            <span className="font-bold relative top-[1px]">
                {language === 'ar' ? 'English' : 'العربية'}
            </span>
        </motion.button>
    );
}
