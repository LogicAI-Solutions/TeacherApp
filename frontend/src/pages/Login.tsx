import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import loginTeacher from '../assets/login_teacher.png';
import { getApiErrorMessage } from '../utils/errors';
import { applyThemeToDOM, getStoredTheme } from '../hooks/useTheme';

export const Login = () => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        applyThemeToDOM('dark-profissional');
        return () => {
            applyThemeToDOM(getStoredTheme());
        };
    }, []);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(nickname, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'ERR_NETWORK' || !err.response) {
                setError('O sistema parece estar offline. Verifique sua conexão ou tente mais tarde.');
            } else if (err.response?.status === 401) {
                setError('Usuário ou senha incorretos. Tente novamente.');
            } else if (err.response?.data?.detail) {
                setError(getApiErrorMessage(err, 'Ocorreu um erro inesperado. Tente novamente.'));
            } else {
                setError('Ocorreu um erro inesperado. Tente novamente.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-stretch bg-[#020617] relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content Wrapper */}
            <div className="flex w-full relative z-10 flex-col lg:flex-row">

                {/* Left Side: Featured Illustration - Hidden on mobile */}
                <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] items-center justify-center p-6 xl:p-12 border-r border-white/5 bg-slate-950/20 backdrop-blur-[2px]">
                    <div className="w-full max-w-[420px] glass-modal p-0 overflow-hidden bg-slate-900/40 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in ring-1 ring-white/10">
                        <div className="relative aspect-[16/10] p-4">
                            <img
                                src={loginTeacher}
                                alt="Teacher Illustration"
                                className="w-full h-full object-cover object-top rounded-2xl shadow-2xl border border-white/5"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent rounded-2xl opacity-60 pointer-events-none"></div>
                        </div>

                        <div className="p-6 lg:p-8">
                            <h2 className="text-xl xl:text-2xl font-extrabold text-white mb-2 tracking-tight leading-tight">
                                Bem-vinda de volta!
                            </h2>
                            <p className="text-slate-400 text-sm xl:text-base leading-relaxed font-light">
                                Acesse seu painel administrativo e tenha controle total sobre suas turmas e finanças.
                            </p>

                            <div className="flex gap-2 mt-6">
                                <div className="w-8 h-1.5 rounded-full bg-primary shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form Section */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto min-h-screen lg:min-h-0 bg-gradient-to-br from-transparent to-black/30">
                    <div className="w-full max-w-[380px] animate-slide-up space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[20px] bg-primary/10 border border-primary/20 backdrop-blur-2xl mb-4 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative group transition-all duration-500 hover:scale-105">
                                <GraduationCap className="w-7 h-7 md:w-8 md:h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-black text-white mb-1 md:mb-2 tracking-tight">
                                Login
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base font-medium">
                                Entre com suas credenciais para continuar.
                            </p>
                        </div>

                        {error && (
                            <div className="text-danger bg-danger/10 p-5 rounded-2xl border border-danger/20 backdrop-blur-md animate-slide-up flex items-center gap-3 font-medium text-sm">
                                <span className="w-2 h-2 rounded-full bg-danger animate-pulse flex-shrink-0"></span>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5 group">
                                <label className="text-sm font-bold text-slate-400 ml-1 tracking-wide group-focus-within:text-primary transition-colors">Usuário</label>
                                <input
                                    type="text"
                                    className="glass-input h-12 px-4 text-base transition-all duration-300 focus:ring-primary/30"
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                    required
                                    placeholder="ex: professor_silva"
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-bold text-slate-400 tracking-wide group-focus-within:text-primary transition-colors">Senha</label>
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-primary-light hover:text-white transition-colors cursor-pointer"
                                        onClick={() => window.open('https://wa.me/5521974546156?text=Olá,+esqueci+minha+senha.', '_blank')}
                                    >
                                        Esqueceu a senha?
                                    </button>
                                </div>
                                <div className="relative group/input">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="glass-input h-12 px-4 pr-12 text-base transition-all duration-300 focus:ring-primary/30"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-all cursor-pointer p-2 rounded-xl hover:bg-white/5 active:scale-90"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="glass-button w-full h-12 mt-4 text-white text-base font-black shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all transform flex items-center justify-center gap-3 group/btn overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-20 group-hover/btn:opacity-40 transition-opacity"></div>
                                <span className="relative z-10">Entrar</span>
                                <span className="relative z-10 group-hover/btn:translate-x-2 transition-transform duration-300 text-lg">→</span>
                            </button>
                        </form>

                        <div className="pt-10 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] hover:text-slate-400 transition-colors cursor-default">
                                Redação Yana
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
