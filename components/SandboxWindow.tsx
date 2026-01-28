'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Monitor } from 'lucide-react';

interface SandboxWindowProps {
    screenshotUrl: string;
}

export default function SandboxWindow({ screenshotUrl }: SandboxWindowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-6 border border-cyber-glow/30"
        >
            <h3 className="text-2xl font-bold mb-4 text-cyber-glow flex items-center gap-3">
                <Monitor className="w-7 h-7" />
                معاينة آمنة للموقع
            </h3>

            {/* Browser frame */}
            <div className="bg-cyber-navy rounded-xl overflow-hidden border border-cyber-safe/20">
                {/* Browser toolbar */}
                <div className="bg-cyber-dark/80 px-4 py-3 flex items-center gap-2 border-b border-cyber-safe/20">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 bg-cyber-navy/50 rounded px-3 py-1 text-sm text-gray-400 font-mono" dir="ltr">
                        {screenshotUrl.includes('urlscan.io') ? 'Secure Preview' : screenshotUrl}
                    </div>
                </div>

                {/* Screenshot content */}
                <div className="relative bg-white min-h-[500px] flex items-center justify-center">
                    <Image
                        src={screenshotUrl}
                        alt="Website Screenshot"
                        width={1200}
                        height={800}
                        className="w-full h-auto"
                        unoptimized
                    />
                </div>
            </div>

            <p className="text-gray-400 text-sm mt-4 text-center">
                هذه معاينة آمنة للموقع دون الحاجة لزيارته فعلياً
            </p>
        </motion.div>
    );
}
