'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Lock, AlertTriangle, Code2, Phone, Mail, X, Linkedin, Activity } from 'lucide-react';

const tips = [
    {
        icon: Shield,
        title: 'لا تثق بالمصادر المجهولة',
        description: 'تجنب النقر على الروابط من مصادر غير موثوقة أو رسائل غريبة',
    },
    {
        icon: Eye,
        title: 'افحص قبل أن تنقر',
        description: 'استخدم أدوات الفحص للتحقق من سلامة الروابط قبل زيارتها',
    },
    {
        icon: Lock,
        title: 'تحقق من HTTPS',
        description: 'تأكد أن الموقع يستخدم بروتوكول HTTPS الآمن',
    },
    {
        icon: AlertTriangle,
        title: 'احذر من التصيد الاحتيالي',
        description: 'لا تدخل معلوماتك الشخصية على مواقع مشبوهة',
    },
];

export default function EducationFooter() {
    const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);

    return (
        <section className="mt-24 mb-12 relative">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-cyber-glow">نصائح الأمان السيبراني</h2>
                <p className="text-gray-400">احمِ نفسك من التهديدات الإلكترونية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {tips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="glass-effect rounded-2xl p-6 border border-cyber-safe/20 hover:border-cyber-safe/50 transition-all duration-300"
                        >
                            <div className="bg-gradient-to-br from-cyber-safe/20 to-cyber-glow/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                                <Icon className="w-8 h-8 text-cyber-safe" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{tip.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{tip.description}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Developer and Status Buttons */}
            <div className="flex justify-center gap-4 mt-12">
                <button
                    onClick={() => setIsDeveloperModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyber-navy/50 hover:bg-cyber-navy border border-cyber-glow/30 rounded-full text-cyber-glow text-sm transition-all hover:scale-105"
                >
                    <Code2 className="w-4 h-4" />
                    <span>عن المطور</span>
                </button>

                <Link
                    href="/status"
                    className="flex items-center gap-2 px-4 py-2 bg-cyber-safe/10 hover:bg-cyber-safe/20 border border-cyber-safe/30 rounded-full text-cyber-safe text-sm transition-all hover:scale-105"
                >
                    <Activity className="w-4 h-4" />
                    <span>فحص الخدمات</span>
                </Link>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 text-sm">
                <p>© 2026 LinkGuard - كاشف الروابط | حماية متقدمة ضد التهديدات الإلكترونية</p>
            </div>

            {/* Developer Modal */}
            <AnimatePresence>
                {isDeveloperModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeveloperModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-cyber-dark/90 border border-cyber-glow/50 p-8 rounded-3xl max-w-lg w-full shadow-[0_0_50px_rgba(56,189,248,0.3)]"
                        >
                            <button
                                onClick={() => setIsDeveloperModalOpen(false)}
                                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="text-center">
                                <div className="w-40 h-40 mx-auto mb-6 rounded-full p-1 bg-gradient-to-br from-cyber-safe to-cyber-glow shadow-[0_0_30px_rgba(0,255,136,0.3)] relative group">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-cyber-dark border-4 border-black/50">
                                        <Image
                                            src="/developer.png"
                                            alt="Moustafa Hamwi"
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    مصطفى الحموي
                                </h3>
                                <p className="text-cyber-glow mb-6 font-mono text-sm tracking-wide">Software Developer | International Training Leader in Scouting</p>

                                <div className="space-y-3 max-w-xs mx-auto">
                                    <a
                                        href="https://www.linkedin.com/in/moustafa-hamwi/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 p-3 bg-[#0077b5]/10 hover:bg-[#0077b5]/30 border border-[#0077b5]/50 rounded-xl transition-all group hover:scale-105 hover:shadow-[0_0_15px_rgba(0,119,181,0.3)]"
                                    >
                                        <Linkedin className="w-5 h-5 text-[#0077b5]" />
                                        <span className="text-gray-200 font-bold group-hover:text-white transition-colors">LinkedIn Profile</span>
                                    </a>

                                    <a
                                        href="https://wa.me/96170863903"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 p-3 bg-cyber-safe/10 hover:bg-cyber-safe/20 border border-cyber-safe/30 rounded-xl transition-all group hover:scale-105"
                                    >
                                        <Phone className="w-5 h-5 text-cyber-safe" />
                                        <span className="text-white font-mono" dir="ltr">+961 70 863 903</span>
                                    </a>

                                    <a
                                        href="mailto:hamwi.moustafa88@gmail.com"
                                        className="flex items-center justify-center gap-3 p-3 bg-cyber-glow/10 hover:bg-cyber-glow/20 border border-cyber-glow/30 rounded-xl transition-all group hover:scale-105"
                                    >
                                        <Mail className="w-5 h-5 text-cyber-glow" />
                                        <span className="text-white font-mono text-xs" dir="ltr">hamwi.moustafa88@gmail.com</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
