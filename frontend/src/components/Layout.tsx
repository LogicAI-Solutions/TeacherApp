import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Users, GraduationCap, Menu, X, ChevronLeft, ChevronRight, Settings, UserCircle, Key, DollarSign } from 'lucide-react';
import api from '../api';

export const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Profile Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.put('/users/me/password', { password: newPassword });
            setMessage('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setIsProfileModalOpen(false);
                setMessage('');
            }, 2000);
        } catch (err: any) {
            setError('Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-bg-dark overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-3 py-2 bg-bg-card border-b border-border w-full fixed top-0 left-0 z-50">
                <h1 className="text-base font-bold flex items-center gap-1.5 text-primary">
                    <GraduationCap size={20} /> TeacherApp
                </h1>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1.5 text-text-muted hover:text-white">
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-50 bg-bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isSidebarCollapsed ? 'w-[70px]' : 'w-[250px]'}
                `}
            >
                {/* Desktop Logo & Toggle */}
                <div className="h-[73px] flex items-center relative px-6 border-b border-border">
                    <div className={`flex items-center gap-2 text-primary font-bold text-xl transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                        <GraduationCap className="shrink-0" />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            TeacherApp
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-bg-card border border-border rounded-full p-1.5 hidden md:flex text-text-muted hover:text-white hover:border-primary transition-all shadow-lg z-10"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>



                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${location.pathname === '/' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Dashboard"
                    >
                        <LayoutDashboard size={20} className={`shrink-0 ${location.pathname === '/' ? 'animate-pulse' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Dashboard</span>
                    </Link>

                    <Link
                        to="/students"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${location.pathname === '/students' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Alunos"
                    >
                        <Users size={20} className={`shrink-0 ${location.pathname === '/students' ? 'animate-pulse' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Alunos</span>
                    </Link>

                    <Link
                        to="/payments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${location.pathname === '/payments' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Financeiro"
                    >
                        <DollarSign size={20} className={`shrink-0 ${location.pathname === '/payments' ? 'animate-pulse' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Financeiro</span>
                    </Link>

                    {user?.is_admin && (
                        <Link
                            to="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${location.pathname === '/admin' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                            title="Administração"
                        >
                            <Settings size={20} className={`shrink-0 ${location.pathname === '/admin' ? 'animate-spin-slow' : ''}`} />
                            <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Administração</span>
                        </Link>
                    )}

                    <button
                        onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 text-text-muted hover:bg-white/5 hover:text-white w-full text-left ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Meus Dados"
                    >
                        <UserCircle size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Meus Dados</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-border">
                    {!isSidebarCollapsed && (
                        <div className="text-sm text-text-muted mb-2 px-2 truncate">{user?.email}</div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`btn btn-outline w-full text-danger border-danger hover:bg-red-500/10 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
                        title="Sair"
                    >
                        <LogOut size={18} />
                        {!isSidebarCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-bg-dark px-3 py-4 sm:p-4 md:p-6 lg:p-8 pt-14 md:pt-6 lg:pt-8 w-full h-screen">
                <div className="container mx-auto max-w-6xl">
                    <Outlet />
                </div>
            </main>

            {/* Profile/Password Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-6 relative animate-slide-up">
                        <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <UserCircle size={20} className="text-primary" /> Meus Dados
                        </h2>

                        <div className="mb-6 p-4 bg-bg-dark/50 rounded-lg border border-white/5">
                            <p className="text-xs text-text-muted uppercase">Email</p>
                            <p className="text-white font-medium">{user?.email}</p>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-t border-white/10 pt-4">
                                <Key size={16} className="text-primary" /> Alterar Senha
                            </h3>

                            {error && <div className="text-danger text-sm bg-danger/10 p-2 rounded border border-danger/20">{error}</div>}
                            {message && <div className="text-success text-sm bg-success/10 p-2 rounded border border-success/20">{message}</div>}

                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nova Senha</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    placeholder="********"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Confirmar Senha</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="********"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-text-muted hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
