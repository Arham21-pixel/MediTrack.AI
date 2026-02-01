'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Activity, AlertTriangle, CheckCircle, TrendingUp, X, Loader2, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface LabValue {
    value: number;
    unit: string;
    status: string;
    normal_range: string;
}

interface AnalysisResult {
    summary: string;
    risk_level: string;
    lab_values?: Record<string, LabValue>;
    recommendations?: string[];
}

export default function ReportsPage() {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedToTimeline, setSavedToTimeline] = useState(false);
    const [reminderSet, setReminderSet] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a JPG, PNG, or PDF file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleAnalyze = async () => {
        if (!file) {
            fileInputRef.current?.click();
            return;
        }

        setStep('processing');
        setError(null);
        setSavedToTimeline(false);
        setReminderSet(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Get auth token if available
            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;

            const response = await fetch('http://localhost:8000/api/reports/demo-upload', {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.analysis) {
                setAnalysis(data.analysis);
                setStep('result');
                
                // If user is authenticated, data is automatically saved to timeline
                if (token) {
                    setSavedToTimeline(true);
                }
            } else {
                throw new Error('No analysis data returned');
            }

        } catch (err: any) {
            console.error('Analysis failed:', err);
            setError(err.message || 'Failed to analyze report');
            setStep('upload');
        }
    };

    const handleSaveToTimeline = async () => {
        if (!analysis || !file) return;
        
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;
            
            if (!token) {
                router.push('/login?redirect=/dashboard/reports');
                return;
            }

            const response = await fetch('http://localhost:8000/api/reports/demo-upload', {
                method: 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                setSavedToTimeline(true);
            } else {
                throw new Error('Failed to save');
            }
        } catch (err: any) {
            setError('Failed to save to timeline. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetReminders = async () => {
        setIsSaving(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;
            
            if (!token) {
                router.push('/login?redirect=/dashboard/reports');
                return;
            }

            // For now, just mark as done
            setReminderSet(true);
            
            setTimeout(() => {
                router.push('/dashboard/timeline');
            }, 1500);
        } catch (err: any) {
            setError('Failed to set reminders. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetUpload = () => {
        setStep('upload');
        setFile(null);
        setPreview(null);
        setAnalysis(null);
        setError(null);
        setSavedToTimeline(false);
        setReminderSet(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'normal': return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800/50';
            case 'warning': return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800/50';
            case 'critical': return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800/50';
            default: return 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800/50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'normal': return <CheckCircle size={18} className="text-green-500" />;
            case 'borderline_high':
            case 'borderline': return <AlertTriangle size={18} className="text-yellow-500" />;
            default: return <AlertTriangle size={18} className="text-red-500" />;
        }
    };

    // Upload View
    if (step === 'upload') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-xl w-full text-center">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                    />

                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Health Report Explainer</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                        Upload your complex lab reports (PDF or Image) and let our AI translate them into plain English.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                    )}

                    {/* File Preview */}
                    {file && preview && (
                        <div className="mb-6 relative inline-block">
                            <img
                                src={preview}
                                alt="Report preview"
                                className="max-w-md max-h-48 rounded-2xl border border-gray-200 dark:border-neutral-700 object-contain"
                            />
                            <button
                                onClick={() => { setFile(null); setPreview(null); }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => !file && fileInputRef.current?.click()}
                        className={`group border-2 border-dashed rounded-[2rem] p-12 cursor-pointer transition-all duration-300 ${file
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                                : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                            }`}
                    >
                        <div className={`w-20 h-20 mb-6 mx-auto rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${file ? 'bg-blue-500 text-white' : 'bg-white dark:bg-neutral-800'
                            }`}>
                            {file ? <CheckCircle size={32} /> : <Upload className="text-gray-400 group-hover:text-blue-500" size={32} />}
                        </div>

                        {file ? (
                            <>
                                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">File Ready!</h3>
                                <p className="text-gray-600 dark:text-gray-400">{file.name}</p>
                                <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                                    Click to Upload Report
                                </h3>
                                <p className="text-gray-400">or drag and drop PDF, JPG, PNG here</p>
                            </>
                        )}
                    </div>

                    {/* Analyze Button */}
                    {file && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleAnalyze}
                            className="mt-8 px-12 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-3 mx-auto"
                        >
                            <Activity size={24} />
                            Analyze with AI
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }

    // Processing View
    if (step === 'processing') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="w-20 h-20 mb-6 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Report...</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{file?.name}</p>
                <div className="flex flex-col gap-2 text-sm text-gray-400 text-center">
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }}>
                        ✓ Extracting lab values...
                    </motion.span>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                        ✓ Checking normal ranges...
                    </motion.span>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                        ✓ Generating AI insights...
                    </motion.span>
                </div>
            </div>
        );
    }

    // Results View
    if (step === 'result' && analysis) {
        const labValues = analysis.lab_values ? Object.entries(analysis.lab_values) : [];

        return (
            <div className="space-y-8 pb-24">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Analysis ✨</h1>
                        <p className="text-gray-500 dark:text-gray-400">AI-powered health insights</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={resetUpload} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-neutral-700 px-4 py-2 rounded-xl">
                            Upload Another
                        </button>
                        {savedToTimeline ? (
                            <div className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl flex items-center gap-2">
                                <CheckCircle size={18} />
                                Saved!
                            </div>
                        ) : (
                            <button 
                                onClick={handleSaveToTimeline}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                                Save to Timeline
                            </button>
                        )}
                    </div>
                </div>

                {/* Risk Summary Card */}
                <div className={`bg-gradient-to-br ${getRiskColor(analysis.risk_level)} rounded-3xl p-8 border`}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-neutral-800/50 rounded-xl shadow-sm">
                            <Activity className={`${analysis.risk_level === 'normal' ? 'text-green-500' :
                                    analysis.risk_level === 'warning' ? 'text-yellow-500' : 'text-orange-500'
                                }`} size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
                                {analysis.risk_level === 'normal' ? 'All Clear! ✓' : `${analysis.risk_level} Risk Level`}
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                                {analysis.summary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lab Values Grid */}
                {labValues.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Lab Values</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {labValues.map(([name, data], i) => (
                                <motion.div
                                    key={name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                                            {name.replace(/_/g, ' ')}
                                        </span>
                                        {getStatusIcon(data.status)}
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{data.value}</span>
                                        <span className="text-xs text-gray-400">{data.unit}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Normal: {data.normal_range}</div>
                                    <div className={`mt-3 text-xs font-bold uppercase tracking-wider ${data.status === 'normal' ? 'text-green-600' :
                                            data.status.includes('borderline') ? 'text-yellow-600' : 'text-red-500'
                                        }`}>
                                        {data.status.replace(/_/g, ' ')}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="bg-lime-50 dark:bg-lime-900/10 rounded-3xl p-8 border border-lime-100 dark:border-lime-900/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="text-lime-500" />
                            Action Plan
                        </h3>
                        <ul className="space-y-4">
                            {analysis.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-lime-200 dark:bg-lime-900/50 text-lime-800 dark:text-lime-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{rec}</span>
                                </li>
                            ))}
                        </ul>
                        {reminderSet ? (
                            <div className="w-full mt-8 py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle size={18} />
                                Viewing Timeline...
                            </div>
                        ) : (
                            <button 
                                onClick={handleSetReminders}
                                disabled={isSaving || !savedToTimeline}
                                className="w-full mt-8 bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                                {savedToTimeline ? 'View in Timeline' : 'Save First'}
                            </button>
                        )}
                        {!savedToTimeline && (
                            <p className="text-xs text-gray-500 mt-2 text-center">Save to timeline first</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
