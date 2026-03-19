import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import api from '../api';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    full_name?: string;
    profile_photo?: string;
    nickname?: string;
    birth_date?: string;
}

interface AuthContextType {
    user: User | null;
    login: (nickname: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser().finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (nickname: string, password: string) => {
        try {
            const params = new URLSearchParams();
            params.append('username', nickname);
            params.append('password', password);

            const res = await api.post('/token', params);
            const token = res.data.access_token;

            localStorage.setItem('token', token);

            // Fetch user immediately
            try {
                const userRes = await api.get('/users/me');
                setUser(userRes.data);
            } catch (err) {
                console.error("Failed to fetch user profile after login", err);
                logout();
                throw err;
            }
        } catch (err) {
            console.error("Login failed", err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

