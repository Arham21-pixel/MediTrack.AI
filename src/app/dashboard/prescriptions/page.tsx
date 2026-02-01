'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Pill, Clock, Check, AlertTriangle, Loader2, X, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Medicine {
    name: string;
    dosage?: string;
    frequency?: string;
    timing?: string[];
    duration_days?: number;
    instructions?: string;
}

interface PrescriptionResult {
    doctor_name?: string;
    hospital_name?: string;
    patient_name?: string;
    date?: string;
    diagnosis?: string;
    medicines: Medicine[];
    notes?: string;
    follow_up_date?: string;
}

export default function PrescriptionsPage() {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [prescriptionData, setPrescriptionData] = useState<PrescriptionResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedToTimeline, setSavedToTimeline] = useState(false);
    const [addedToSchedule, setAddedToSchedule] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a JPG, PNG, or PDF file');
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Create preview for images
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

    const startProcessing = async () => {
        if (!file) {
            // If no file, trigger file input
            fileInputRef.current?.click();
            return;
        }

        setStep('processing');
        setError(null);
        setSavedToTimeline(false);
        setAddedToSchedule(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Get auth token if available
            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;

            const response = await fetch('http://localhost:8000/api/prescriptions/demo-upload', {
                method: 'POST',
                body: formData,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.parsed_data) {
                setPrescriptionData(data.parsed_data);
                setStep('result');
                
                // If user is authenticated, data is automatically saved to timeline
                if (token) {
                    setSavedToTimeline(true);
                }
            } else {
                throw new Error('No data returned from analysis');
            }

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Failed to analyze prescription');
            setStep('upload');
        }
    };

    const handleSaveToTimeline = async () => {
        if (!prescriptionData || !file) return;
        
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;
            
            if (!token) {
                // Redirect to login if not authenticated
                router.push('/login?redirect=/dashboard/prescriptions');
                return;
            }

            // Re-upload with auth to save to timeline
            const response = await fetch('http://localhost:8000/api/prescriptions/demo-upload', {
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

    const handleAddToSchedule = async () => {
        if (!prescriptionData) return;
        
        setIsSaving(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;
            
            if (!token) {
                router.push('/login?redirect=/dashboard/prescriptions');
                return;
            }

            // The medicines are already added when saved to timeline
            // This just provides visual confirmation
            setAddedToSchedule(true);
            
            // Navigate to dashboard to see the schedule
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError('Failed to add to schedule. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetUpload = () => {
        setStep('upload');
        setFile(null);
        setPreview(null);
        setPrescriptionData(null);
        setError(null);
        setSavedToTimeline(false);
        setAddedToSchedule(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="pb-24 max-w-5xl mx-auto">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
            />

            {step === 'upload' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Prescription Reader</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-lg">
                        Take a photo of your doctor's handwritten notes. Our AI will digitize it and create your schedule instantly.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                    )}

                    {/* File Preview */}
                    {file && preview && (
                        <div className="mb-6 relative">
                            <img
                                src={preview}
                                alt="Prescription preview"
                                className="max-w-md max-h-64 rounded-2xl border border-gray-200 dark:border-neutral-700 object-contain"
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
                        className={`w-full max-w-2xl group border-2 border-dashed rounded-[2rem] p-16 cursor-pointer transition-all duration-300 flex flex-col items-center ${file
                            ? 'border-lime-400 bg-lime-50 dark:bg-lime-900/10'
                            : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:border-lime-400 dark:hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-900/10'
                            }`}
                    >
                        <div className={`w-24 h-24 mb-8 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${file ? 'bg-lime-500 text-white' : 'bg-white dark:bg-neutral-800'
                            }`}>
                            {file ? <Check size={40} /> : <Upload className="text-gray-400 group-hover:text-lime-500" size={40} />}
                        </div>

                        {file ? (
                            <>
                                <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-2">File Ready!</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">{file.name}</p>
                                <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lime-600 transition-colors">
                                    Upload Prescription
                                </h3>
                                <p className="text-gray-400">Drag & drop or click to browse</p>
                                <p className="text-gray-400 text-sm mt-2">Supports JPG, PNG, PDF</p>
                            </>
                        )}
                    </div>

                    {/* Analyze Button */}
                    {file && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={startProcessing}
                            className="mt-8 px-12 py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold text-lg rounded-2xl shadow-lg shadow-lime-500/30 transition-all flex items-center gap-3"
                        >
                            <FileText size={24} />
                            Analyze with AI
                        </motion.button>
                    )}
                </div>
            )}

            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-32 h-32 relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-gray-100 dark:border-neutral-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-lime-500 rounded-full border-t-transparent animate-spin"></div>
                        <FileText size={40} className="text-lime-600 dark:text-lime-400 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-2">Analyzing Prescription...</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{file?.name}</p>
                    <div className="flex flex-col gap-3 mt-4 text-center">
                        <ProcessStep label="Extracting text from image" delay={0} />
                        <ProcessStep label="Parsing medical information" delay={1} />
                        <ProcessStep label="Identifying medicines" delay={2} />
                        <ProcessStep label="Building your schedule" delay={3} />
                    </div>
                </div>
            )}

            {step === 'result' && prescriptionData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prescription Analyzed ✨</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                {prescriptionData.doctor_name && `Prescribed by ${prescriptionData.doctor_name}`}
                                {prescriptionData.date && ` • ${prescriptionData.date}`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={resetUpload} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                Scan New
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
                                    className="px-6 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                                    Save to Timeline
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Diagnosis */}
                    {prescriptionData.diagnosis && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6">
                            <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">Diagnosis</h3>
                            <p className="text-blue-700 dark:text-blue-300">{prescriptionData.diagnosis}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Medicine List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Medicines Found ({prescriptionData.medicines?.length || 0})
                            </h2>
                            {prescriptionData.medicines?.map((med, i) => (
                                <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Pill size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{med.name}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {med.dosage && (
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Dosage</span>
                                                    <p className="font-medium text-gray-900 dark:text-gray-200">{med.dosage}</p>
                                                </div>
                                            )}
                                            {med.frequency && (
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Frequency</span>
                                                    <p className="font-medium text-gray-900 dark:text-gray-200">{med.frequency}</p>
                                                </div>
                                            )}
                                            {med.duration_days && (
                                                <div>
                                                    <span className="text-xs text-gray-400 uppercase tracking-wide">Duration</span>
                                                    <p className="font-medium text-gray-900 dark:text-gray-200">{med.duration_days} days</p>
                                                </div>
                                            )}
                                        </div>
                                        {med.instructions && (
                                            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                                    <AlertTriangle size={16} />
                                                    {med.instructions}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Side Panel */}
                        <div className="space-y-6">
                            {/* Notes */}
                            {prescriptionData.notes && (
                                <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Doctor's Notes</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{prescriptionData.notes}</p>
                                </div>
                            )}

                            {/* Follow-up */}
                            {prescriptionData.follow_up_date && (
                                <div className="bg-lime-50 dark:bg-lime-900/10 p-6 rounded-3xl border border-lime-100 dark:border-lime-900/30">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Follow-up Date</h3>
                                    <p className="text-lime-600 dark:text-lime-400 font-medium">{prescriptionData.follow_up_date}</p>
                                </div>
                            )}

                            {/* Schedule Preview */}
                            <div className="bg-lime-50 dark:bg-lime-900/10 p-6 rounded-3xl border border-lime-100 dark:border-lime-900/30">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Schedule</h3>
                                <div className="space-y-3">
                                    {prescriptionData.medicines?.slice(0, 3).map((med, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-lime-950/30 rounded-xl">
                                            <Clock size={16} className="text-lime-600" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{med.name}</span>
                                        </div>
                                    ))}
                                </div>
                                {addedToSchedule ? (
                                    <div className="w-full mt-6 py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        Added to Schedule!
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleAddToSchedule}
                                        disabled={isSaving || !savedToTimeline}
                                        className="w-full mt-6 py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                                        {savedToTimeline ? 'Add to My Schedule' : 'Save First to Add'}
                                    </button>
                                )}
                                {!savedToTimeline && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">Save to timeline first to add to schedule</p>
                                )}
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
