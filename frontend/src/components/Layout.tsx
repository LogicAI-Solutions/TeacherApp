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
        <div className="flex h-screen bg-bg-dark overflow-hidden relative">
            {/* Background Orbs for Glass Effect */}
            <div className="orb orb-primary w-96 h-96 -top-48 -left-48 hidden md:block" style={{ animationDelay: '0s' }}></div>
            <div className="orb orb-purple w-64 h-64 bottom-20 right-20 hidden md:block" style={{ animationDelay: '3s' }}></div>

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 glass-header w-full fixed top-0 left-0 z-50">
                <h1 className="text-base font-bold flex items-center gap-2 text-gradient">
                    <GraduationCap size={22} className="text-primary" /> YanaGestão
                </h1>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/10 transition-all duration-300">
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-50 glass-sidebar flex flex-col transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${isSidebarCollapsed ? 'w-[70px]' : 'w-[260px]'}
                `}
            >
                {/* Desktop Logo & Toggle */}
                <div className="h-[73px] flex items-center relative px-6 border-b border-white/5">
                    <div className={`flex items-center gap-2 font-bold text-xl transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                        <GraduationCap className="shrink-0 text-primary" />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-gradient ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            YanaGestão
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1.5 hidden md:flex text-text-muted hover:text-white hover:border-primary/50 transition-all shadow-lg z-10 hover:bg-white/15"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>



                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Dashboard"
                    >
                        <LayoutDashboard size={20} className={`shrink-0 ${location.pathname === '/' ? '' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Dashboard</span>
                    </Link>

                    <Link
                        to="/classes"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/classes' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Turmas"
                    >
                        <GraduationCap size={20} className={`shrink-0 ${location.pathname === '/classes' ? '' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Turmas</span>
                    </Link>

                    <Link
                        to="/students"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/students' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Alunos"
                    >
                        <Users size={20} className={`shrink-0 ${location.pathname === '/students' ? '' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Alunos</span>
                    </Link>

                    <Link
                        to="/payments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/payments' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Financeiro"
                    >
                        <DollarSign size={20} className={`shrink-0 ${location.pathname === '/payments' ? '' : ''}`} />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Financeiro</span>
                    </Link>

                    {user?.is_admin && (
                        <Link
                            to="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`nav-link-glass ${location.pathname === '/admin' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                            title="Administração"
                        >
                            <Settings size={20} className={`shrink-0 ${location.pathname === '/admin' ? 'animate-spin-slow' : ''}`} />
                            <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Administração</span>
                        </Link>
                    )}

                    <button
                        onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}
                        className={`nav-link-glass text-text-muted hover:text-white w-full text-left ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Meus Dados"
                    >
                        <UserCircle size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Meus Dados</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5">
                    {!isSidebarCollapsed && (
                        <div className="text-sm text-text-muted mb-3 px-2 truncate">{user?.email}</div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={`btn w-full text-danger border-danger/30 bg-danger/10 hover:bg-danger/20 backdrop-blur-sm ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
                        title="Sair"
                    >
                        <LogOut size={18} />
                        {!isSidebarCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto px-3 py-4 sm:p-4 md:p-6 lg:p-8 pt-16 md:pt-6 lg:pt-8 w-full h-screen">
                <div className="container mx-auto max-w-6xl">
                    <Outlet />
                </div>
            </main>

            {/* Profile/Password Modal */}
            {isProfileModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-md p-8 relative animate-slide-up">
                        <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <UserCircle size={22} className="text-primary" /> Meus Dados
                        </h2>

                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <p className="text-xs text-text-muted uppercase tracking-wider">Email</p>
                            <p className="text-white font-medium mt-1">{user?.email}</p>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-t border-white/10 pt-4">
                                <Key size={16} className="text-primary" /> Alterar Senha
                            </h3>

                            {error && <div className="text-danger text-sm bg-danger/10 p-3 rounded-xl border border-danger/20 backdrop-blur-sm">{error}</div>}
                            {message && <div className="text-success text-sm bg-success/10 p-3 rounded-xl border border-success/20 backdrop-blur-sm">{message}</div>}

                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nova Senha</label>
                                <input
                                    type="password"
                                    className="glass-input mt-2"
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
                                    className="glass-input mt-2"
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
                                    className="px-4 py-2 rounded-xl text-text-muted hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="glass-button text-white font-bold py-2 px-6 rounded-xl cursor-pointer disabled:opacity-50"
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
