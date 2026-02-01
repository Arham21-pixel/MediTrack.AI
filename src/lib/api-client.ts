/**
 * MediTrack API Client
 * Axios-based API client with authentication and TypeScript support
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

// =============================================================================
// Types & Interfaces (matching backend Pydantic schemas)
// =============================================================================

export type MedicineStatus = 'taken' | 'missed' | 'skipped';

export interface ParsedMedicine {
    name: string;
    dosage?: string;
    frequency?: string;
    timing?: string[];
    duration_days?: number;
    instructions?: string;
}

export interface PrescriptionParsedData {
    doctor_name?: string;
    hospital_name?: string;
    patient_name?: string;
    date?: string;
    diagnosis?: string;
    medicines: ParsedMedicine[];
    notes?: string;
    follow_up_date?: string;
    raw_text?: string;
}

export interface Prescription {
    id: string;
    user_id: string;
    file_url?: string;
    doctor_name?: string;
    parsed_data?: PrescriptionParsedData;
    uploaded_at: string;
    medicines_count: number;
}

export interface Medicine {
    id: string;
    prescription_id: string;
    name: string;
    dosage?: string;
    frequency?: string;
    timing?: string[];
    duration_days?: number;
    start_date?: string;
    end_date?: string;
    instructions?: string;
    is_active: boolean;
    days_remaining?: number;
}

export interface MedicineListResponse {
    medicines: Medicine[];
    total: number;
    active_count: number;
}

export interface MedicineScheduleItem {
    medicine_id: string;
    medicine_name: string;
    dosage?: string;
    scheduled_time: string;
    timing: string;
    status?: MedicineStatus;
    is_overdue: boolean;
}

export interface TodayScheduleResponse {
    date: string;
    schedule: MedicineScheduleItem[];
    total_medicines: number;
    completed: number;
    pending: number;
}

export interface AdherenceStats {
    total_doses: number;
    taken_doses: number;
    missed_doses: number;
    skipped_doses: number;
    adherence_percentage: number;
    current_streak: number;
    best_streak: number;
    period_start: string;
    period_end: string;
}

export interface MedicineLogResponse {
    id: string;
    medicine_id: string;
    scheduled_time: string;
    status: MedicineStatus;
    taken_at?: string;
    created_at: string;
    medicine_name?: string;
}

export interface HealthReport {
    id: string;
    user_id: string;
    file_url?: string;
    report_type?: string;
    lab_values?: Record<string, any>;
    ai_summary?: string;
    risk_level?: 'normal' | 'warning' | 'critical';
    uploaded_at: string;
}

export interface TimelineItem {
    id: string;
    type: 'prescription' | 'medicine' | 'report';
    title: string;
    description?: string;
    date: string;
    status?: string;
    metadata?: Record<string, any>;
}

export interface TimelineResponse {
    items: TimelineItem[];
    total: number;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    date_of_birth?: string;
    blood_type?: string;
    allergies?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

// =============================================================================
// API Client Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log for debugging
if (typeof window !== 'undefined') {
    console.log('[API Client] Base URL:', API_BASE_URL);
    console.log('[API Client] Environment API URL:', process.env.NEXT_PUBLIC_API_URL);
}

class ApiClient {
    private client: AxiosInstance;
    private authToken: string | null = null;

    constructor() {
        console.log('[API Client] Initializing with baseURL:', API_BASE_URL);
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                // Try to get token from localStorage (for Supabase session)
                if (typeof window !== 'undefined') {
                    const storedToken = localStorage.getItem('meditrack_token');
                    if (storedToken) {
                        this.authToken = storedToken;
                    }
                }

                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Clear token on 401 but DON'T redirect - allow demo mode
                    this.clearToken();
                    // Only redirect if explicitly on a protected page action (not initial loads)
                    // This allows demo mode to work without authentication
                }
                return Promise.reject(error);
            }
        );
    }

    // Token Management
    setToken(token: string) {
        this.authToken = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('meditrack_token', token);
        }
    }

    clearToken() {
        this.authToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('meditrack_token');
        }
    }

    // =============================================================================
    // Health Check
    // =============================================================================

    async healthCheck() {
        const response = await this.client.get('/api/health');
        return response.data;
    }

    // =============================================================================
    // Authentication
    // =============================================================================

    async signup(email: string, password: string, name?: string): Promise<AuthResponse> {
        try {
            console.log('[API] Signup request to /api/auth/signup');
            const response = await this.client.post('/api/auth/signup', { email, password, name });
            if (response.data.access_token) {
                this.setToken(response.data.access_token);
            }
            return response.data;
        } catch (error: any) {
            console.error('[API] Signup error:', error.message, error.response?.data);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            console.log('[API] Login request to /api/auth/login with email:', email);
            const response = await this.client.post('/api/auth/login', { email, password });
            if (response.data.access_token) {
                this.setToken(response.data.access_token);
            }
            return response.data;
        } catch (error: any) {
            console.error('[API] Login error:', error.message, error.response?.data);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/api/auth/logout');
        } finally {
            this.clearToken();
        }
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.client.get('/api/auth/me');
        return response.data;
    }

    async updateProfile(data: { 
        name?: string; 
        phone?: string;
        date_of_birth?: string;
        blood_type?: string;
        allergies?: string;
    }): Promise<User> {
        const response = await this.client.put('/api/auth/profile', data);
        return response.data;
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.client.post('/api/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
    }

    // =============================================================================
    // Prescriptions
    // =============================================================================

    async uploadPrescription(file: File): Promise<Prescription> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.client.post('/api/prescriptions/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getPrescriptions(page: number = 1, perPage: number = 10): Promise<{ prescriptions: Prescription[]; total: number }> {
        try {
            const response = await this.client.get('/api/prescriptions', {
                params: { page, per_page: perPage },
            });
            return response.data;
        } catch (error) {
            // Return empty list on error (e.g. 401 unauthorized)
            return { prescriptions: [], total: 0 };
        }
    }

    async getPrescription(id: string): Promise<Prescription> {
        const response = await this.client.get(`/api/prescriptions/${id}`);
        return response.data;
    }

    async deletePrescription(id: string): Promise<void> {
        try {
            await this.client.delete(`/api/prescriptions/${id}`);
        } catch (error) {
            console.warn('Delete prescription failed:', error);
        }
    }

    // =============================================================================
    // Medicines
    // =============================================================================

    async getMedicines(activeOnly: boolean = true): Promise<MedicineListResponse> {
        try {
            const response = await this.client.get('/api/medicines', {
                params: { active_only: activeOnly },
            });
            return response.data;
        } catch (error) {
            return { medicines: [], total: 0, active_count: 0 };
        }
    }

    async getTodaySchedule(): Promise<TodayScheduleResponse> {
        try {
            const response = await this.client.get('/api/medicines/schedule/today');
            return response.data;
        } catch (error) {
            return { 
                date: new Date().toISOString().split('T')[0], 
                schedule: [], 
                total_medicines: 0, 
                completed: 0, 
                pending: 0 
            };
        }
    }

    async getMedicine(id: string): Promise<Medicine> {
        const response = await this.client.get(`/api/medicines/${id}`);
        return response.data;
    }

    async markMedicineTaken(medicineId: string, takenAt?: Date): Promise<MedicineLogResponse> {
        const response = await this.client.post(`/api/medicines/${medicineId}/mark-taken`, {
            taken_at: takenAt?.toISOString(),
        });
        return response.data;
    }

    async markMedicineMissed(medicineId: string, reason?: string): Promise<MedicineLogResponse> {
        const response = await this.client.post(`/api/medicines/${medicineId}/mark-missed`, {
            reason,
        });
        return response.data;
    }

    async getAdherenceStats(days: number = 30): Promise<AdherenceStats> {
        try {
            const response = await this.client.get('/api/medicines/adherence-stats', {
                params: { days },
            });
            return response.data;
        } catch (error) {
            return {
                total_doses: 0,
                taken_doses: 0,
                missed_doses: 0,
                skipped_doses: 0,
                adherence_percentage: 0,
                current_streak: 0,
                best_streak: 0,
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString()
            };
        }
    }

    async updateMedicineLog(medicineId: string, status: MedicineStatus): Promise<MedicineLogResponse> {
        if (status === 'taken') {
            return this.markMedicineTaken(medicineId);
        } else {
            return this.markMedicineMissed(medicineId);
        }
    }

    // =============================================================================
    // Health Reports
    // =============================================================================

    async uploadReport(file: File, reportType?: string): Promise<HealthReport> {
        const formData = new FormData();
        formData.append('file', file);
        if (reportType) {
            formData.append('report_type', reportType);
        }

        const response = await this.client.post('/api/reports/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getReports(): Promise<{ reports: HealthReport[]; total: number }> {
        try {
            const response = await this.client.get('/api/reports');
            return response.data;
        } catch (error) {
            return { reports: [], total: 0 };
        }
    }

    async getReport(id: string): Promise<HealthReport> {
        const response = await this.client.get(`/api/reports/${id}`);
        return response.data;
    }

    async deleteReport(id: string): Promise<void> {
        try {
            await this.client.delete(`/api/reports/${id}`);
        } catch (error) {
            console.warn('Delete report failed:', error);
        }
    }

    // =============================================================================
    // Timeline
    // =============================================================================

    async getTimeline(limit: number = 50): Promise<TimelineResponse> {
        try {
            const response = await this.client.get('/api/timeline', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            return { items: [], total: 0 };
        }
    }

    // =============================================================================
    // Notifications
    // =============================================================================

    async getNotificationSettings(): Promise<any> {
        const response = await this.client.get('/api/notifications/settings');
        return response.data;
    }

    async updateNotificationSettings(settings: any): Promise<any> {
        const response = await this.client.put('/api/notifications/settings', settings);
        return response.data;
    }

    async sendTestEmail(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await this.client.post(`/api/notifications/email/test?email=${encodeURIComponent(email)}`);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to send test email'
            };
        }
    }

    async sendEmailNotification(request: {
        email: string;
        notification_type: 'reminder' | 'missed_dose' | 'low_supply' | 'weekly_summary' | 'test';
        medicine_name?: string;
        dosage?: string;
        time?: string;
        remaining_days?: number;
    }): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await this.client.post('/api/notifications/email/send', request);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to send email notification'
            };
        }
    }

    async sendWeeklySummary(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await this.client.post(`/api/notifications/email/weekly-summary?email=${encodeURIComponent(email)}`);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.detail || error.message || 'Failed to send weekly summary'
            };
        }
    }

    async getNotificationHistory(limit: number = 50): Promise<any[]> {
        try {
            const response = await this.client.get('/api/notifications/history', { params: { limit } });
            return response.data;
        } catch (error) {
            return [];
        }
    }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// React Hooks for API calls - with demo data fallback for unauthenticated users
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

// No demo data - only show real prescription data

export function useMedicines() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMedicines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.getMedicines();
            setMedicines(response.medicines);
            setError(null);
        } catch (err: any) {
            // On error, return empty array - only show real data
            console.log('Medicines fetch failed, showing empty state');
            setMedicines([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedicines();
    }, [fetchMedicines]);

    return { medicines, loading, error, refetch: fetchMedicines };
}

export function useTodaySchedule() {
    const [schedule, setSchedule] = useState<TodayScheduleResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.getTodaySchedule();
            setSchedule(response);
            setError(null);
        } catch (err: any) {
            // On error, return empty schedule - only show real data
            console.log('Schedule fetch failed, showing empty state');
            setSchedule(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    return { schedule, loading, error, refetch: fetchSchedule };
}

export function useAdherenceStats(days: number = 30) {
    const [stats, setStats] = useState<AdherenceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const response = await apiClient.getAdherenceStats(days);
                setStats(response);
                setError(null);
            } catch (err: any) {
                // On error, return null - only show real data
                console.log('Adherence stats fetch failed, showing empty state');
                setStats(null);
                setError(null);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [days]);

    return { stats, loading, error };
}

export function useTimeline(limit: number = 50) {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeline = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.getTimeline(limit);
            setTimeline(response.items || []);
            setError(null);
        } catch (err: any) {
            // On error, return empty timeline
            console.log('Timeline fetch failed, showing empty state');
            setTimeline([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    return { timeline, loading, error, refetch: fetchTimeline };
}

