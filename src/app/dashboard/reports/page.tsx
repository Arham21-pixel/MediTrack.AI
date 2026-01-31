'use client';

import { useState } from 'react';
import { Upload, FileText, Activity, AlertTriangle, CheckCircle, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Mock Analysis Data
    const analysisResults = {
        labName: "CityPath Labs",
        date: "Oct 24, 2024",
        type: "Comprehensive Metabolic Panel",
        overview: [
            { name: "Hemoglobin", value: "13.5", range: "12.0 - 15.5", status: "normal", unit: "g/dL" },
            { name: "Glucose (Fasting)", value: "105", range: "70 - 99", status: "borderline", unit: "mg/dL" },
            { name: "Cholesterol Total", value: "210", range: "< 200", status: "abnormal", unit: "mg/dL" },
            { name: "Vitamin D", value: "25", range: "30 - 100", status: "abnormal", unit: "ng/mL" },
        ],
        summary: "Your report indicates generally good health, but there are signs of Pre-Diabetes (Glucose) and borderline High Cholesterol. Vitamin D levels are also insufficient.",
        recommendations: [
            "Reduce sugar and refined carb intake immediately.",
            "Schedule a follow-up for Lipid Profile in 3 months.",
            "Start Vitamin D3 supplementation (2000 IU daily) as per doctor's advice.",
            "Increase daily physical activity to 30 mins."
        ]
    };

    const handleUpload = () => {
        setIsUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            setIsUploading(false);
            setIsAnalyzing(true);
            // Simulate analysis delay
            setTimeout(() => {
                setIsAnalyzing(false);
                setShowResults(true);
            }, 3000);
        }, 1500);
    };

    if (showResults) {
        return (
            <div className="space-y-8 pb-24">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Analysis</h1>
                        <p className="text-gray-500 dark:text-gray-400">AI explanation for {analysisResults.type}</p>
                    </div>
                    <button onClick={() => setShowResults(false)} className="text-sm text-gray-500 hover:text-gray-900 border px-3 py-1 rounded-full">Upload Another</button>
                </div>

                {/* Risk Summary Card */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-3xl p-8 border border-orange-200 dark:border-orange-800/50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-orange-900/50 rounded-xl shadow-sm">
                            <Activity className="text-orange-500" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Moderate Health Risk</h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                                {analysisResults.summary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Values Grid */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Key Findings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analysisResults.overview.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</span>
                                    {item.status === 'normal' && <CheckCircle size={18} className="text-green-500" />}
                                    {item.status === 'borderline' && <AlertTriangle size={18} className="text-yellow-500" />}
                                    {item.status === 'abnormal' && <AlertTriangle size={18} className="text-red-500" />}
                                </div>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{item.value}</span>
                                    <span className="text-xs text-gray-400">{item.unit}</span>
                                </div>
                                <div className="text-xs text-gray-400">Range: {item.range}</div>
                                <div className={`mt-3 text-xs font-bold uppercase tracking-wider ${item.status === 'normal' ? 'text-green-600' :
                                        item.status === 'borderline' ? 'text-yellow-600' : 'text-red-500'
                                    }`}>
                                    {item.status}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* AI Explanation & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="text-lime-500" />
                            AI Health Insights
                        </h3>
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Why is my Glucose high?</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    A fasting glucose of 105 mg/dL is considered "Pre-diabetic". It means your body is starting to have trouble processing sugar effortlessly. This can often be reversed with diet changes.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Vitamin D deficiency risks</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Low Vitamin D (25 ng/mL) can lead to bone pain, muscle weakness, and fatigue. Since many older adults don't get enough sun, a supplement is usually the fix.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-lime-50 dark:bg-lime-900/10 rounded-3xl p-8 border border-lime-100 dark:border-lime-900/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Action Plan</h3>
                        <ul className="space-y-4">
                            {analysisResults.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-lime-200 dark:bg-lime-900/50 text-lime-800 dark:text-lime-400 flex items-center justify-center text-xs font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{rec}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full mt-8 bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                            Set Reminders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Health Report Explainer</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-12 text-lg">Upload your complex lab reports (PDF or Image) and let our AI translate them into plain English.</p>

                <div
                    onClick={handleUpload}
                    className="group border-2 border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] p-12 cursor-pointer hover:border-lime-400 dark:hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-900/10 transition-all duration-300 relative overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                            <motion.div
                                key="analyzing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-20 h-20 mb-6 rounded-full border-4 border-lime-200 border-t-lime-500 animate-spin" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Report...</h3>
                                <div className="flex flex-col gap-2 text-sm text-gray-400">
                                    <span className="animate-pulse">Extracting values...</span>
                                    <span className="animate-pulse delay-75">Checking normal ranges...</span>
                                    <span className="animate-pulse delay-150">Generating insights...</span>
                                </div>
                            </motion.div>
                        ) : isUploading ? (
                            <motion.div
                                key="uploading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-20 h-20 mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                                    <FileText className="text-blue-500 animate-bounce" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Uploading...</h3>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-20 h-20 mb-6 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload className="text-gray-400 group-hover:text-lime-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lime-600 transition-colors">Click to Upload Report</h3>
                                <p className="text-gray-400">or drag and drop PDF, JPG, PNG here</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
