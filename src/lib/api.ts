// MediTrack API Client Configuration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Health Check
    async healthCheck() {
        return this.request<{ status: string; app_name: string }>('/api/health');
    }

    // Prescriptions
    async uploadPrescription(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<ApiResponse<any>>('/api/prescriptions/upload', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData,
        });
    }

    async getPrescriptions() {
        return this.request<ApiResponse<any[]>>('/api/prescriptions');
    }

    // Medicines
    async getMedicines() {
        return this.request<ApiResponse<any[]>>('/api/medicines');
    }

    async markMedicineTaken(medicineId: string) {
        return this.request<ApiResponse<any>>(`/api/medicines/${medicineId}/mark-taken`, {
            method: 'POST',
        });
    }

    async getAdherenceStats() {
        return this.request<ApiResponse<any>>('/api/medicines/adherence-stats');
    }

    // Health Reports
    async uploadReport(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request<ApiResponse<any>>('/api/reports/upload', {
            method: 'POST',
            headers: {},
            body: formData,
        });
    }

    async getReports() {
        return this.request<ApiResponse<any[]>>('/api/reports');
    }

    async getReportById(reportId: string) {
        return this.request<ApiResponse<any>>(`/api/reports/${reportId}`);
    }

    // Timeline
    async getTimeline() {
        return this.request<ApiResponse<any[]>>('/api/timeline');
    }

    // Notifications
    async getNotificationSettings() {
        return this.request<ApiResponse<any>>('/api/notifications/settings');
    }

    async updateNotificationSettings(settings: any) {
        return this.request<ApiResponse<any>>('/api/notifications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
