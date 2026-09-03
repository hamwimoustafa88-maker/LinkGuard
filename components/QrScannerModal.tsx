'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (url: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasStartedRef = useRef(false);

    const startScanner = async () => {
        try {
            setError(null);
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            // Check if browser supports media devices
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('متصفحك لا يدعم الوصول للكاميرا');
            }

            await scanner.start(
                { facingMode: 'environment' }, // Use back camera on mobile
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Success callback
                    handleScanSuccess(decodedText);
                },
                () => {
                    // Error callback (called frequently while no code is in frame — ignore)
                }
            );

            setIsScanning(true);
        } catch (err: unknown) {
            const name = err instanceof Error ? err.name : undefined;
            const message = err instanceof Error ? err.message : undefined;
            let errorMessage = 'فشل الوصول إلى الكاميرا.';

            // Handle specific errors
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || message?.includes('permission')) {
                errorMessage = 'تم رفض الوصول للكاميرا. يرجى السماح للموقع باستخدام الكاميرا.';
            } else if (name === 'NotFoundError' || message?.includes('device')) {
                errorMessage = 'لم يتم العثور على كاميرا في جهازك.';
            } else if (message?.includes('secure context') || message?.includes('SSL')) {
                errorMessage = 'الكاميرا تتطلب اتصال آمن (HTTPS).';
            } else if (message) {
                errorMessage = `خطأ في الكاميرا: ${message}`;
            }

            setError(errorMessage);
            console.error('QR Scanner error:', err);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        setIsScanning(false);
    };

    const handleScanSuccess = async (decodedText: string) => {
        await stopScanner();
        onScanSuccess(decodedText);
        onClose();
    };

    const handleClose = async () => {
        await stopScanner();
        setError(null);
        onClose();
    };

    useEffect(() => {
        if (isOpen && !hasStartedRef.current) {
            startScanner();
            hasStartedRef.current = true;
        }

        return () => {
            if (hasStartedRef.current) {
                stopScanner();
                hasStartedRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-lg glass-effect rounded-3xl p-8 border-2 border-cyber-safe/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <Camera className="w-8 h-8 text-cyber-safe" />
                                <h2 className="text-3xl font-bold text-cyber-glow">مسح رمز QR</h2>
                            </div>
                            <p className="text-gray-400">وجّه الكاميرا نحو رمز QR لفحصه</p>
                        </div>

                        {/* QR Scanner Container */}
                        <div className="relative mb-4">
                            <div
                                id="qr-reader"
                                className="w-full rounded-2xl overflow-hidden border-2 border-cyber-safe/50"
                            />

                            {/* Scanning overlay */}
                            {isScanning && (
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {/* Scanning line animation */}
                                    <motion.div
                                        className="absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-cyber-safe to-transparent"
                                        animate={{
                                            top: ['0%', '100%'],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 bg-cyber-danger/20 border border-cyber-danger rounded-xl"
                            >
                                <AlertTriangle className="w-5 h-5 text-cyber-danger shrink-0" />
                                <p className="text-cyber-danger text-sm">{error}</p>
                            </motion.div>
                        )}

                        {/* Info text */}
                        <div className="mt-4 p-4 bg-cyber-navy/50 rounded-xl">
                            <p className="text-gray-400 text-sm text-center">
                                💡 تأكد من منح إذن الكاميرا في متصفحك
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
