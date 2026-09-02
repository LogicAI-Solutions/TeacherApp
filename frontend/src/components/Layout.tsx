import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { LogOut, LayoutDashboard, GraduationCap, BookOpen, Menu, X, ChevronLeft, ChevronRight, Settings, UserCircle, DollarSign, MessageCircle } from 'lucide-react';

export const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const userName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Usuario');
    const userInitial = userName.charAt(0).toUpperCase();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    const profilePhotoUrl = user?.profile_photo
        ? (user.profile_photo.startsWith('http') || user.profile_photo.startsWith('data:')
            ? user.profile_photo
            : user.profile_photo.startsWith('/')
                ? `${apiBaseUrl}${user.profile_photo}`
                : `${apiBaseUrl}/${user.profile_photo}`)
        : null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSupport = () => {
        window.open('https://wa.me/5521974546156?text=Ol%C3%A1,+preciso+de+suporte+no+sistema+de+gest%C3%A3o.', '_blank');
    };

    const handleOpenProfile = () => {
        setIsMobileMenuOpen(false);
        navigate('/profile');
    };

    return (
        <div className="flex h-screen overflow-hidden relative">
            {/* Background Orbs for Glass Effect */}
            <div className="orb orb-primary w-96 h-96 -top-48 -left-48 hidden md:block" style={{ animationDelay: '0s' }}></div>
            <div className="orb orb-purple w-64 h-64 bottom-20 right-20 hidden md:block" style={{ animationDelay: '3s' }}></div>

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 glass-header w-full fixed top-0 left-0 z-50">
                <h1 className="text-base font-bold flex items-center gap-2 text-gradient">
                    <GraduationCap size={22} className="text-primary" /> Redação Yana
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
                <div className="h-[73px] flex items-center relative border-b border-white/5">
                    <div className={`flex items-center gap-2 font-bold text-xl transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full px-0' : 'px-6'}`}>
                        <GraduationCap size={24} className="shrink-0 text-primary" />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 text-gradient ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            Redação Yana
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
                        <LayoutDashboard size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Painel</span>
                    </Link>

                    <Link
                        to="/classes"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/classes' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Turmas"
                    >
                        <BookOpen size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Turmas</span>
                    </Link>

                    <Link
                        to="/students"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/students' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Alunos"
                    >
                        <GraduationCap size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Alunos</span>
                    </Link>

                    <Link
                        to="/payments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`nav-link-glass ${location.pathname === '/payments' ? 'active text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:text-white'} ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
                        title="Financeiro"
                    >
                        <DollarSign size={20} className="shrink-0" />
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
                </nav>

                <div className="p-4 border-t border-white/5 space-y-3">
                    {!isSidebarCollapsed ? (
                        <>
                            <button
                                onClick={handleOpenProfile}
                                className={`w-full text-left rounded-xl border transition-all p-3 backdrop-blur-sm ${location.pathname === '/profile' ? 'border-primary/30 bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                title="Configurar perfil"
                            >
                                <div className="flex items-center gap-3">
                                    {profilePhotoUrl ? (
                                        <img
                                            src={profilePhotoUrl}
                                            alt="Foto de perfil"
                                            className="w-9 h-9 rounded-full object-cover border border-primary/30 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-primary/25 border border-primary/30 text-primary-light flex items-center justify-center font-semibold text-sm shrink-0">
                                            {userInitial}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </button>

                            {/* <button
                                onClick={handleSupport}
                                className="w-full h-10 flex items-center gap-2 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                title="Suporte"
                            >
                                <MessageCircle size={17} className="shrink-0" />
                                <span className="font-medium">Suporte</span>
                            </button> */}

                            <button
                                onClick={handleLogout}
                                className="btn w-full justify-start text-danger border-danger/30 bg-danger/10 hover:bg-danger/20 backdrop-blur-sm"
                                title="Sair"
                            >
                                <LogOut size={18} />
                                <span>Sair</span>
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <button
                                onClick={handleOpenProfile}
                                className={`w-full h-10 flex items-center justify-center rounded-xl border transition-all ${location.pathname === '/profile' ? 'border-primary/30 bg-primary/10 text-white' : 'border-white/10 bg-white/5 text-text-muted hover:text-white hover:bg-white/10'}`}
                                title="Configurar perfil"
                            >
                                {profilePhotoUrl ? (
                                    <img
                                        src={profilePhotoUrl}
                                        alt="Foto de perfil"
                                        className="w-6 h-6 rounded-full object-cover border border-primary/30"
                                    />
                                ) : (
                                    <UserCircle size={18} />
                                )}
                            </button>
                            {/* <button
                                onClick={handleSupport}
                                className="w-full h-10 flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                title="Suporte"
                            >
                                <MessageCircle size={17} />
                            </button> */}
                            <button
                                onClick={handleLogout}
                                className="w-full h-10 flex items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto px-3 py-4 sm:p-4 md:p-6 lg:p-8 pt-16 md:pt-6 lg:pt-8 w-full h-screen">
                <div className="w-full h-full">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
};
