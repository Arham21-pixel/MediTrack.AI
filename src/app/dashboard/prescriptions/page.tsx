'use client';

import { useState } from 'react';
import { Upload, FileText, Pill, Clock, Calendar, Check, AlertTriangle, ChevronRight, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrescriptionsPage() {
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');

    // Mock Processed Data
    const prescriptionData = {
        doctor: "Dr. Sarah Johnson",
        date: "Oct 24, 2024",
        medicines: [
            { name: "Amoxicillin", dose: "500mg", freq: "3x daily", duration: "7 days", type: "Antibiotic", purpose: "Treat bacterial infection", warning: null },
            { name: "Ibuprofen", dose: "400mg", freq: "As needed", duration: "5 days", type: "Pain Reliever", purpose: "Reduce inflammation/pain", warning: "Take with food" },
        ],
        interactionWarning: {
            severity: "low",
            message: "No major interactions found between these medications."
        }
    };

    const startProcessing = () => {
        setStep('processing');
        setTimeout(() => {
            setStep('result');
        }, 3500);
    };

    return (
        <div className="pb-24 max-w-5xl mx-auto">
            {step === 'upload' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Prescription Reader</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg max-w-lg">Take a photo of your doctor's handwritten notes. Our AI will digitize it and create your schedule instantly.</p>

                    <div
                        onClick={startProcessing}
                        className="w-full max-w-2xl group border-2 border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] p-16 cursor-pointer hover:border-lime-400 dark:hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-900/10 transition-all duration-300 flex flex-col items-center"
                    >
                        <div className="w-24 h-24 mb-8 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="text-gray-400 group-hover:text-lime-500" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lime-600 transition-colors">Upload Prescription</h3>
                        <p className="text-gray-400">Supports JPG, PNG, PDF</p>
                    </div>
                </div>
            )}

            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-32 h-32 relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-gray-100 dark:border-neutral-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-lime-500 rounded-full border-t-transparent animate-spin"></div>
                        <FileText size={40} className="text-lime-600 dark:text-lime-400 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-2">Reading Doctor's Handwriting...</h2>
                    <div className="flex flex-col gap-3 mt-4 text-center">
                        <ProcessStep label="Scanning document structure" delay={0} />
                        <ProcessStep label="Deciphering medical terms" delay={1} />
                        <ProcessStep label="Checking drug interactions" delay={2} />
                        <ProcessStep label="Creating schedule" delay={3} />
                    </div>
                </div>
            )}

            {step === 'result' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prescription Analyzed</h1>
                            <p className="text-gray-500 dark:text-gray-400">Prescribed by {prescriptionData.doctor} • {prescriptionData.date}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">Scan New</button>
                            <button className="px-6 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors">Save to Timeline</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Medicine List */}
                        <div className="lg:col-span-2 space-y-4">
                            {prescriptionData.medicines.map((med, i) => (
                                <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Pill size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{med.name}</h3>
                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-full">{med.type}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-xs text-gray-400 uppercase tracking-wide">Dosage</span>
                                                <p className="font-medium text-gray-900 dark:text-gray-200">{med.dose}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 uppercase tracking-wide">Frequency</span>
                                                <p className="font-medium text-gray-900 dark:text-gray-200">{med.freq}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 uppercase tracking-wide">Duration</span>
                                                <p className="font-medium text-gray-900 dark:text-gray-200">{med.duration}</p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                                            <h4 className="font-bold text-sm text-lime-600 dark:text-lime-400 mb-1">Why this?</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{med.purpose}</p>
                                        </div>

                                        {med.warning && (
                                            <div className="mt-3 flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
                                                <AlertTriangle size={16} />
                                                {med.warning}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-lime-50 dark:bg-lime-900/10 p-6 rounded-3xl border border-lime-100 dark:border-lime-900/30">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Schedule Preview</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-lime-950/30 rounded-xl">
                                        <Clock size={16} className="text-lime-600" />
                                        <span className="text-sm font-medium">08:00 AM • Amoxicillin</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-lime-950/30 rounded-xl">
                                        <Clock size={16} className="text-lime-600" />
                                        <span className="text-sm font-medium">02:00 PM • Amoxicillin</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-lime-950/30 rounded-xl">
                                        <Clock size={16} className="text-lime-600" />
                                        <span className="text-sm font-medium">08:00 PM • Amoxicillin</span>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-lime-500/20">
                                    Confirm Schedule
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                                    <Share2 size={24} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Share</span>
                                </button>
                                <button className="p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                                    <Download size={24} className="text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProcessStep({ label, delay }: { label: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.8 }}
            className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
        >
            <Check size={16} className="text-green-500" />
            <span className="text-sm">{label}</span>
        </motion.div>
    );
}
