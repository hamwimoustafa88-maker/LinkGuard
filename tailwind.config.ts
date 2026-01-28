import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    dark: '#0a0e27',
                    navy: '#0f172a',
                    safe: '#00ff88',
                    danger: '#ff0055',
                    warning: '#ffaa00',
                    glow: '#00ffff',
                },
            },
            fontFamily: {
                cairo: ['Cairo', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
            },
            animation: {
                'radar-scan': 'radar 2s linear infinite',
                'neon-pulse': 'pulse-glow 2s ease-in-out infinite',
                'typewriter': 'typing 0.5s steps(20)',
            },
            keyframes: {
                radar: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
                    '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
                },
                typing: {
                    from: { width: '0' },
                    to: { width: '100%' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
