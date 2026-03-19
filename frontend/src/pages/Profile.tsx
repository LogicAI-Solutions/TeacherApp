import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { UserCircle, Key, Camera, Save, Palette, Shield } from 'lucide-react';
import axios from 'axios';

const THEMES = [
    {
        id: 'azul-sereno',
        name: 'AZUL SERENO',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    },
    {
        id: 'acolhedor',
        name: 'ACOLHEDOR',
        color: '#a3a042',
        gradient: 'linear-gradient(135deg, #a3a042, #8b8936)',
    },
    {
        id: 'dark-profissional',
        name: 'DARK PROFISSIONAL',
        color: '#3b3d6e',
        gradient: 'linear-gradient(135deg, #3b3d6e, #2d2f55)',
    },
];

export const Profile = () => {
    const { user, refreshUser } = useAuth();

    // Personal Info State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');

    // Photo State
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Theme State
    const [selectedTheme, setSelectedTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'dark-profissional';
    });

    const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    const buildPhotoUrl = (photoPath?: string | null) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        if (!apiBaseUrl) return photoPath;
        if (photoPath.startsWith('/')) return `${apiBaseUrl}${photoPath}`;
        return `${apiBaseUrl}/${photoPath}`;
    };

    const getProfilePhotoUrl = () => {
        if (photoPreview) return photoPreview;
        return buildPhotoUrl(user?.profile_photo);
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfileError('');
        setProfileMessage('');

        if (!file.type.startsWith('image/')) {
            setProfileError('Selecione um arquivo de imagem válido.');
            e.target.value = '';
            return;
        }

        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            setProfileError('A imagem deve ter no máximo 5MB.');
            e.target.value = '';
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setPhotoUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/users/me/photo', formData);
            await refreshUser();
            setProfileMessage('Foto de perfil atualizada com sucesso!');
            setTimeout(() => setProfileMessage(''), 3000);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const detail = error.response?.data?.detail;
                setProfileError(typeof detail === 'string' ? detail : 'Erro ao fazer upload da foto.');
            } else {
                setProfileError('Erro ao fazer upload da foto.');
            }
            setPhotoPreview(null);
        } finally {
            setPhotoUploading(false);
            e.target.value = '';
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileError('');
        setProfileMessage('');

        try {
            await api.put('/users/me/profile', { full_name: fullName });
            await refreshUser();
            setProfileMessage('Dados atualizados com sucesso!');
            setTimeout(() => setProfileMessage(''), 3000);
        } catch {
            setProfileError('Erro ao atualizar dados.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }
        if (newPassword.length < 4) {
            setPasswordError('A senha deve ter pelo menos 4 caracteres.');
            return;
        }
        setPasswordLoading(true);
        setPasswordError('');
        setPasswordMessage('');

        try {
            await api.put('/users/me/password', { password: newPassword });
            setPasswordMessage('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch {
            setPasswordError('Erro ao atualizar senha.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleThemeChange = (themeId: string) => {
        setSelectedTheme(themeId);
        localStorage.setItem('app-theme', themeId);
        // Theme application logic can be expanded later
    };

    const photoUrl = getProfilePhotoUrl();
    const userInitial = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <UserCircle size={28} className="text-primary" />
                    Perfil e Configurações
                </h1>
                <p className="text-text-muted mt-2">
                    Gerencie suas informações pessoais, segurança e aparência do sistema.
                </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Personal Info */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <UserCircle size={20} className="text-primary" />
                        Informações Pessoais
                    </h2>

                    {/* Profile Photo */}
                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="relative cursor-pointer group"
                            onClick={handlePhotoClick}
                        >
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="Foto de perfil"
                                    className="w-32 h-32 rounded-full object-cover border-2 border-white/20 group-hover:border-primary/50 transition-all duration-300"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-white/20 group-hover:border-primary/50 flex items-center justify-center text-4xl font-bold text-primary-light transition-all duration-300">
                                    {userInitial}
                                </div>
                            )}
                            {/* Camera overlay */}
                            <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center border-2 border-bg-dark shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {photoUploading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Camera size={16} className="text-white" />
                                )}
                            </div>
                        </div>
                        <p className="text-text-muted text-sm mt-3">
                            Clique no ícone para alterar sua foto
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        {profileError && (
                            <div className="text-danger text-sm bg-danger/10 p-3 rounded-xl border border-danger/20 backdrop-blur-sm">
                                {profileError}
                            </div>
                        )}
                        {profileMessage && (
                            <div className="text-success text-sm bg-success/10 p-3 rounded-xl border border-success/20 backdrop-blur-sm">
                                {profileMessage}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">
                                Email (não alterável)
                            </label>
                            <input
                                type="email"
                                className="glass-input mt-2 opacity-60 cursor-not-allowed"
                                value={user?.email || ''}
                                readOnly
                                disabled
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                className="glass-input mt-2"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileSaving}
                            className="w-full glass-button text-white font-bold py-3 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {profileSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </form>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Security Card */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                            <Shield size={20} className="text-primary" />
                            Segurança
                        </h2>

                        <form onSubmit={handleUpdatePassword} className="space-y-5">
                            {passwordError && (
                                <div className="text-danger text-sm bg-danger/10 p-3 rounded-xl border border-danger/20 backdrop-blur-sm">
                                    {passwordError}
                                </div>
                            )}
                            {passwordMessage && (
                                <div className="text-success text-sm bg-success/10 p-3 rounded-xl border border-success/20 backdrop-blur-sm">
                                    {passwordMessage}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    className="glass-input mt-2"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    className="glass-input mt-2"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full glass-button text-white font-bold py-3 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Key size={18} />
                                {passwordLoading ? 'Alterando...' : 'Alterar Minha Senha'}
                            </button>
                        </form>
                    </div>

                    {/* Appearance Card */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                            <Palette size={20} className="text-primary" />
                            Aparência
                        </h2>

                        <div className="grid grid-cols-3 gap-3">
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme.id)}
                                    className={`
                                        flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer
                                        ${selectedTheme === theme.id
                                            ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/20'
                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                                        }
                                    `}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full shadow-lg"
                                        style={{ background: theme.gradient }}
                                    />
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center leading-tight">
                                        {theme.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
