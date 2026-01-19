import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="flex items-center justify-center min-h-screen p-4 bg-bg-dark relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>

            <div className="glass-card w-full max-w-sm p-8 relative z-10 animate-fade-in">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-primary mb-2">
                        Bem-vindo
                    </h1>
                    <p className="text-text-muted text-sm">
                        Acesse o sistema de gestão escolar.
                    </p>
                </div>

                {error && <div className="text-danger mb-4 text-center text-sm bg-danger/10 p-3 rounded-lg border border-danger/20 animate-slide-up">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Usuário</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted/50"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            required
                            placeholder="seu_usuario"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Senha</label>
                        <input
                            type="password"
                            className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-muted/50"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-hover text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2">
                        Entrar
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-text-muted">
                    Esqueceu a senha?
                    <button
                        className="text-primary-light ml-2 hover:text-white transition-colors cursor-pointer font-medium hover:underline"
                        onClick={() => window.open('https://wa.me/5521994152560?text=Olá,+esqueci+minha+senha+do+sistema+de+gestão.', '_blank')}
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
