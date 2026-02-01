'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api-client';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { name?: string; phone?: string; date_of_birth?: string; blood_type?: string; allergies?: string }) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                // Check if we have a token stored
                const token = typeof window !== 'undefined' ? localStorage.getItem('meditrack_token') : null;
                if (token) {
                    const userData = await apiClient.getCurrentUser();
                    setUser(userData);
                }
            } catch (error) {
                console.log('No authenticated user');
                // Clear invalid token
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('meditrack_token');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        console.log('[AuthContext] Starting login for:', email);
        try {
            const response = await apiClient.login(email, password);
            console.log('[AuthContext] Login successful, fetching user data');
            // Fetch full user data after login
            const userData = await apiClient.getCurrentUser();
            setUser(userData);
            console.log('[AuthContext] User loaded:', userData);
        } catch (error: any) {
            console.error('[AuthContext] Login error:', error.message, error.response?.data);
            throw error;
        }
    }, []);

    const signup = useCallback(async (email: string, password: string, name?: string) => {
        const response = await apiClient.signup(email, password, name);
        // Fetch full user data after signup
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiClient.logout();
        } catch (error) {
            // Still clear local state even if API call fails
        }
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data: { name?: string; phone?: string; date_of_birth?: string; blood_type?: string; allergies?: string }) => {
        const updatedUser = await apiClient.updateProfile(data);
        setUser(updatedUser);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await apiClient.getCurrentUser();
            setUser(userData);
        } catch (error) {
            setUser(null);
        }
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
