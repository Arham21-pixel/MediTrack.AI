'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Sparkles, Image, Languages, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
    success: boolean;
    type: 'prescription' | 'report';
    data?: any;
    translatedData?: any;
    language?: string;
    error?: string;
}

type Language = 'english' | 'hindi' | 'marathi';

export default function UploadPage() {
    const [uploadType, setUploadType] = useState<'prescription' | 'report'>('prescription');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Debug API_BASE_URL on first render
    if (typeof window !== 'undefined') {
        console.log('[Upload] API_BASE_URL:', API_BASE_URL);
    }

    const getLanguageLabel = (lang: Language) => {
        switch (lang) {
            case 'hindi': return 'हिंदी (Hindi)';
            case 'marathi': return 'मराठी (Marathi)';
            default: return 'English';
        }
    };

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setResult(null);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, [handleFileSelect]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleLanguageChange = async (lang: Language) => {
        setSelectedLanguage(lang);
        
        // If we already have a result, translate it immediately without re-uploading
        if (result && result.success && result.data?.parsed_data) {
            if (lang === 'english') {
                setResult({
                    ...result,
                    language: 'english'
                });
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/prescriptions/demo-translate?language=${lang}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(result.data.parsed_data),
                });

                if (!response.ok) {
                    throw new Error('Translation failed');
                }

                const data = await response.json();
                
                setResult({
                    ...result,
                    translatedData: data.translated_data,
                    language: lang
                });
            } catch (err) {
                console.error('Translation error:', err);
                // Keep the previous result but show error toast/alert if possible, 
                // or just don't update the language in the result to avoid broken UI
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            let endpoint: string;
            let resultData: any;

            if (selectedLanguage === 'english') {
                // Simple analysis without translation
                endpoint = uploadType === 'prescription'
                    ? '/api/prescriptions/demo-upload'
                    : '/api/reports/demo-upload';

                const fullUrl = `${API_BASE_URL}${endpoint}`;
                console.log('[Upload] Fetching from:', fullUrl);

                const response = await fetch(fullUrl, {
                    method: 'POST',
                    body: formData,
                });

                console.log('[Upload] Response status:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                resultData = await response.json();

                setResult({
                    success: true,
                    type: uploadType,
                    data: resultData,
                    language: 'english'
                });
            } else {
                // Analysis with translation to Hindi or Marathi
                endpoint = uploadType === 'prescription'
                    ? `/api/prescriptions/demo-upload-and-translate?language=${selectedLanguage}`
                    : `/api/reports/demo-upload-and-translate?language=${selectedLanguage}`;

                const fullUrl = `${API_BASE_URL}${endpoint}`;
                console.log('[Upload] Fetching from:', fullUrl);

                const response = await fetch(fullUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                resultData = await response.json();

                setResult({
                    success: true,
                    type: uploadType,
                    data: resultData,
                    translatedData: resultData.translated_data,
                    language: selectedLanguage
                });
            }

        } catch (err: any) {
            console.error('Analysis failed:', err);
            setResult({
                success: false,
                type: uploadType,
                error: err.message || 'Analysis failed. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        AI Prescription Analysis
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Upload your prescription for instant AI-powered analysis and simplification
                    </p>
                </div>

                {/* Language Selector */}
                <div className="flex justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Globe size={18} />
                        <span className="text-sm font-medium">Simplify in:</span>
                    </div>
                    {(['english', 'hindi', 'marathi'] as Language[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => handleLanguageChange(lang)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLanguage === lang
                                    ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-lime-300'
                                } disabled:opacity-50`}
                        >
                            {getLanguageLabel(lang)}
                        </button>
                    ))}
                </div>

                {/* Upload Area */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                    {!file ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-lime-500 dark:hover:border-lime-500 transition-colors"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                            />
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime-100 dark:bg-lime-900/30 text-lime-600 flex items-center justify-center">
                                <Image size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Drop your prescription image here
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                or click to browse files
                            </p>
                            <p className="text-sm text-slate-400">
                                Supports: JPG, PNG, PDF (Max 10MB)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Preview */}
                            <div className="flex items-start gap-6">
                                {preview && (
                                    <div className="w-48 h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{file.name}</h3>
                                            <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            {selectedLanguage !== 'english' && (
                                                <p className="text-sm text-purple-500 mt-1">
                                                    <Languages size={14} className="inline mr-1" />
                                                    Will translate to {getLanguageLabel(selectedLanguage)}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={resetUpload}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {!result && (
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={loading}
                                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-lime-500 hover:bg-lime-400 text-white disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    {selectedLanguage !== 'english' ? 'Analyzing & Translating...' : 'Analyzing with AI...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={20} />
                                                    {selectedLanguage !== 'english' ? `Analyze & Translate to ${selectedLanguage === 'hindi' ? 'हिंदी' : 'मराठी'}` : 'Analyze with AI'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Result */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`rounded-2xl p-6 ${result.success
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30'
                                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {result.success ? (
                                                <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                                            )}
                                            <div className="flex-1">
                                                <h3 className={`font-bold mb-2 ${result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                                                    {result.success ? 'Analysis Complete!' : 'Analysis Failed'}
                                                    {result.language && result.language !== 'english' && (
                                                        <span className="ml-2 text-sm font-normal text-purple-600">
                                                            (Translated to {result.language === 'hindi' ? 'हिंदी' : 'मराठी'})
                                                        </span>
                                                    )}
                                                </h3>

                                                {result.success && result.data ? (
                                                    <div className="space-y-4">
                                                        {/* Prescription Result */}
                                                        {result.type === 'prescription' && result.data.parsed_data && (
                                                            <>
                                                                {result.data.parsed_data.doctor_name && (
                                                                    <p className="text-slate-700 dark:text-slate-300">
                                                                        <span className="font-medium">Doctor:</span> {result.data.parsed_data.doctor_name}
                                                                    </p>
                                                                )}
                                                                {result.data.parsed_data.diagnosis && (
                                                                    <p className="text-slate-700 dark:text-slate-300">
                                                                        <span className="font-medium">Diagnosis:</span> {result.data.parsed_data.diagnosis}
                                                                    </p>
                                                                )}
                                                                {result.data.parsed_data.medicines && result.data.parsed_data.medicines.length > 0 && (
                                                                    <div>
                                                                        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Medicines Found:</p>
                                                                        <ul className="space-y-2">
                                                                            {result.data.parsed_data.medicines.map((med: any, i: number) => (
                                                                                <li key={i} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                                                                    <span className="font-bold text-slate-900 dark:text-white">{med.name}</span>
                                                                                    {med.dosage && <span className="text-slate-500"> - {med.dosage}</span>}
                                                                                    {med.frequency && <span className="text-slate-500"> ({med.frequency})</span>}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Translated Prescription */}
                                                                {result.translatedData && (
                                                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                                                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                                                                            <Languages size={16} />
                                                                            {result.language === 'hindi' ? 'हिंदी में समझें' : 'मराठीत समजून घ्या'}
                                                                        </h4>
                                                                        {result.translatedData.diagnosis_translated && (
                                                                            <p className="text-purple-900 dark:text-purple-200 text-lg mb-3">
                                                                                <strong>बीमारी:</strong> {result.translatedData.diagnosis_translated}
                                                                            </p>
                                                                        )}
                                                                        {result.translatedData.medicines_translated?.map((med: any, i: number) => (
                                                                            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-2 border border-purple-200 dark:border-purple-700">
                                                                                <p className="font-bold text-slate-900 dark:text-white">{med.name}</p>
                                                                                {med.name_translated && <p className="text-purple-600">{med.name_translated}</p>}
                                                                                {med.dosage_simple && <p className="text-slate-600 dark:text-slate-400">💊 {med.dosage_simple}</p>}
                                                                                {med.when_to_take && <p className="text-slate-600 dark:text-slate-400">⏰ {med.when_to_take}</p>}
                                                                                {med.food_instructions && <p className="text-slate-600 dark:text-slate-400">🍽️ {med.food_instructions}</p>}
                                                                                {med.warnings && <p className="text-orange-600 dark:text-orange-400">⚠️ {med.warnings}</p>}
                                                                            </div>
                                                                        ))}
                                                                        {result.translatedData.general_instructions && (
                                                                            <p className="mt-2 text-purple-800 dark:text-purple-200">📋 {result.translatedData.general_instructions}</p>
                                                                        )}
                                                                        {result.translatedData.emergency_signs && (
                                                                            <p className="mt-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">🚨 {result.translatedData.emergency_signs}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Report Result */}
                                                        {result.type === 'report' && result.data.analysis && (
                                                            <>
                                                                <p className="text-slate-700 dark:text-slate-300">
                                                                    <span className="font-medium">Summary:</span> {result.data.analysis.summary}
                                                                </p>
                                                                {result.data.analysis.risk_level && (
                                                                    <p className={`font-medium ${result.data.analysis.risk_level === 'normal' ? 'text-green-600' :
                                                                            result.data.analysis.risk_level === 'warning' ? 'text-yellow-600' : 'text-red-600'
                                                                        }`}>
                                                                        Risk Level: {result.data.analysis.risk_level.toUpperCase()}
                                                                    </p>
                                                                )}
                                                                
                                                                {/* Translated Report */}
                                                                {result.translatedData && (
                                                                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                                                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                                                                            <Languages size={16} />
                                                                            {result.language === 'hindi' ? 'हिंदी में समझें' : 'मराठीत समजून घ्या'}
                                                                        </h4>
                                                                        {result.translatedData.summary_translated && (
                                                                            <p className="text-purple-900 dark:text-purple-200 text-lg mb-3">📊 {result.translatedData.summary_translated}</p>
                                                                        )}
                                                                        {result.translatedData.risk_level_translated && (
                                                                            <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>जोखिम:</strong> {result.translatedData.risk_level_translated}</p>
                                                                        )}
                                                                        {result.translatedData.key_findings_translated?.length > 0 && (
                                                                            <div className="mb-3">
                                                                                <p className="font-medium text-purple-800 dark:text-purple-300 mb-1">मुख्य बातें:</p>
                                                                                {result.translatedData.key_findings_translated.map((f: string, i: number) => (
                                                                                    <p key={i} className="text-slate-600 dark:text-slate-400">✓ {f}</p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {result.translatedData.recommendations_translated?.length > 0 && (
                                                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                                                                                <p className="font-medium text-purple-800 dark:text-purple-300 mb-1">💡 क्या करें:</p>
                                                                                {result.translatedData.recommendations_translated.map((r: string, i: number) => (
                                                                                    <p key={i} className="text-slate-600 dark:text-slate-400">• {r}</p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {result.translatedData.lifestyle_tips?.length > 0 && (
                                                                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                                                <p className="font-medium text-green-800 dark:text-green-300">🌿 जीवनशैली:</p>
                                                                                {result.translatedData.lifestyle_tips.map((t: string, i: number) => (
                                                                                    <p key={i} className="text-green-700 dark:text-green-400">• {t}</p>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {result.translatedData.doctor_advice && (
                                                                            <p className="mt-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">👨‍⚕️ {result.translatedData.doctor_advice}</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={resetUpload}
                                                            className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                        >
                                                            Upload Another
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-red-600 dark:text-red-400">{result.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Feature Info */}
                <div className="mt-12 mb-8">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Why use AI Analysis?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 text-white flex items-center justify-center shadow-lg shadow-lime-500/20">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Analysis</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Powered by GPT-4 Vision for accurate medicine extraction from handwritten prescriptions
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Languages size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multi-Language</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Get your prescription simplified in Hindi & Marathi for easy understanding by everyone
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <CheckCircle size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Simple Explanations</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Complex medical terms explained in everyday language with dosage and timing info
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="text-center mt-8">
                    <a href="/dashboard" className="text-slate-500 hover:text-lime-600 transition-colors">
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
