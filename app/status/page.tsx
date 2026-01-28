'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Activity, ArrowRight, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ServiceStatus {
    status: 'online' | 'offline' | 'error' | 'unknown';
    latency: number;
    message: string;
}

interface HealthData {
    virustotal: ServiceStatus;
    urlscan: ServiceStatus;
    unshorten: ServiceStatus;
}

export default function StatusPage() {
    const [status, setStatus] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const checkSystem = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setStatus(data);
            setLastUpdated(new Date().toLocaleTimeString('ar-EG'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSystem();
    }, []);

    const StatusCard = ({ name, service, icon: Icon }: { name: string, service: ServiceStatus | undefined, icon: any }) => {
        if (!service) return null;

        // Config based on status
        let color = 'text-gray-400';
        let bg = 'bg-gray-800/30';
        let border = 'border-gray-700';
        let StatusIcon = Activity;

        if (service.status === 'online') {
            color = 'text-emerald-400';
            bg = 'bg-emerald-900/10';
            border = 'border-emerald-500/30';
            StatusIcon = CheckCircle;
        } else if (service.status === 'error') {
            color = 'text-yellow-400';
            bg = 'bg-yellow-900/10';
            border = 'border-yellow-500/30';
            StatusIcon = AlertTriangle;
        } else {
            color = 'text-red-400';
            bg = 'bg-red-900/10';
            border = 'border-red-500/30';
            StatusIcon = XCircle;
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-6 rounded-2xl glass-effect border ${border} hover:border-opacity-100 transition-all`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-200">{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-sm ${color} font-bold`}>
                                {service.status === 'online' ? 'متصل' : service.status === 'error' ? 'خطأ' : 'غير متصل'}
                            </span>
                            {service.latency > 0 && (
                                <span className="text-xs text-gray-500 font-mono">
                                    ({service.latency}ms)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-left">
                    <StatusIcon className={`w-6 h-6 ${color} opacity-80`} />
                    {service.message && service.message !== 'متصل' && (
                        <p className="text-xs text-gray-400 mt-2 max-w-[150px]">{service.message}</p>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <main className="min-h-screen relative overflow-hidden bg-cyber-dark text-white p-8">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-cyber-dark via-cyber-navy to-cyber-dark -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent -z-10" />

            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center gap-2 text-cyber-safe hover:text-cyber-glow transition-colors">
                        <ArrowRight className="w-5 h-5" />
                        <span>العودة للرئيسية</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-cyber-safe">حالة النظام</h1>
                        <p className="text-gray-400 text-sm mt-1">فحص الاتصال بالخدمات الخارجية</p>
                    </div>
                    <div className="w-24"></div> {/* Spacer */}
                </header>

                <div className="space-y-6">
                    {/* Controls */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            {lastUpdated && <p className="text-gray-500 text-sm">آخر تحديث: {lastUpdated}</p>}
                        </div>
                        <button
                            onClick={checkSystem}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg bg-cyber-safe text-cyber-dark font-bold hover:bg-cyber-glow transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'جاري الفحص...' : 'فحص الآن'}
                        </button>
                    </div>

                    {!status && loading && (
                        <div className="text-center py-20">
                            <RefreshCw className="w-12 h-12 text-cyber-safe animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">جاري الاتصال بالخوادم...</p>
                        </div>
                    )}

                    {status && (
                        <div className="grid gap-4">
                            <StatusCard
                                name="VirusTotal API"
                                service={status.virustotal}
                                icon={Shield}
                            />
                            <StatusCard
                                name="URLScan.io API"
                                service={status.urlscan}
                                icon={Server}
                            />
                            <StatusCard
                                name="Unshorten Service"
                                service={status.unshorten}
                                icon={Activity}
                            />
                        </div>
                    )}

                    {/* Summary */}
                    {status && (
                        <div className="mt-8 p-6 rounded-xl bg-cyber-navy/20 border border-gray-700">
                            <h3 className="text-lg font-bold mb-2 text-gray-200">ملخص التقرير</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                يتم اختبار الاتصال المباشر بمفاتيح API المخزنة في النظام. إذا ظهرت أي خدمة باللون الأحمر، يرجى التحقق من ملف <code>.env.local</code> وصلاحية المفاتيح.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
