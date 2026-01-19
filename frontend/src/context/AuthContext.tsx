import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import api from '../api';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    is_admin: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (nickname: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Optionally verify token validity with backend here
            // For now, we'll just try to fetch user profile or assume logged in if we want
            // But let's fetch /users/me to be robust
            api.get('/users/me')
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
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
                // Even if fetching profile fails, we have the token? 
                // No, if we can't get profile, something is wrong. Better to fail.
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

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
