import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');


    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Assuming the login function in AuthContext now handles the API call and token storage
            await login(nickname, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'ERR_NETWORK' || !err.response) {
                setError('O sistema parece estar offline. Verifique sua conexão ou tente mais tarde.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.response?.status === 401) {
                setError('Usuário ou senha incorretos. Tente novamente.');
            } else {
                setError('Ocorreu um erro inesperado. Tente novamente.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-dark to-bg-darker relative overflow-hidden">
            {/* Background Gradients - Enhanced Glass Style */}
            <div className="absolute inset-0 bg-gradient-to-br from-bg-dark to-bg-darker"></div>
            <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-30%] right-[-20%] w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>

            <div className="glass-modal w-full max-w-sm p-8 relative z-10 animate-fade-in">
                {/* Top Glow Line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gradient mb-2">
                        Bem-vinda
                    </h1>
                    <p className="text-text-muted text-sm">
                        Acesse o sistema de gestão escolar.
                    </p>
                </div>

                {error && <div className="text-danger mb-4 text-center text-sm bg-danger/10 p-3 rounded-xl border border-danger/20 backdrop-blur-sm animate-slide-up">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Usuário</label>
                        <input
                            type="text"
                            className="glass-input"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            required
                            placeholder="seu_usuario"
                            autoComplete="username"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="glass-input pr-12"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="glass-button w-full text-white font-bold py-3 rounded-xl mt-2">
                        Entrar
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-text-muted">
                    Esqueceu a senha?
                    <button
                        className="text-primary-light ml-2 hover:text-white transition-colors cursor-pointer font-medium hover:underline"
                        onClick={() => window.open('https://wa.me/5521974546156?text=Olá,+esqueci+minha+senha+do+sistema+de+gestão.', '_blank')}
                    >
                        Falar com Suporte
                    </button>
                    {/* Registration link removed as requested */}
                </div>
            </div>
        </div>
    );
};

export default Login;
