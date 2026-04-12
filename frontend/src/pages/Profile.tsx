import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { UserCircle, Key, Camera, Save, Palette, Shield } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const { selectedTheme, changeTheme, themes } = useTheme();

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

    // Crop State
    const [imageForCrop, setImageForCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropModal, setShowCropModal] = useState(false);


    const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

    const buildPhotoUrl = (photoPath?: string | null) => {
        if (!photoPath) return null;
        if (photoPath?.startsWith('data:')) return photoPath;
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

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfileError('');
        setProfileMessage('');

        if (!file.type.startsWith('image/')) {
            setProfileError('Selecione um arquivo de imagem válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageForCrop(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = (_croppedArea: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    };

    const handleConfirmCrop = async () => {
        if (!imageForCrop || !croppedAreaPixels) return;

        setShowCropModal(false);
        setPhotoUploading(true);

        try {
            const croppedImage = await getCroppedImg(imageForCrop, croppedAreaPixels);
            if (!croppedImage) throw new Error('Falha ao processar imagem');

            // Preparar Preview Local
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(croppedImage);

            // Upload via Base64 (estamos enviando como arquivo para o endpoint que agora converte para b64)
            const formData = new FormData();
            formData.append('file', croppedImage, 'profile.jpg');
            await api.post('/users/me/photo', formData);
            
            await refreshUser();
            setProfileMessage('Foto de perfil atualizada!');
            setTimeout(() => setProfileMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setProfileError('Erro ao salvar a foto cortada.');
        } finally {
            setPhotoUploading(false);
            setImageForCrop(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => changeTheme(theme.id)}
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

            {/* Crop Modal */}
            {showCropModal && imageForCrop && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="glass-card w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden">
                        <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center">
                            <h3 className="font-bold text-white">Ajustar Foto</h3>
                            <button onClick={() => setShowCropModal(false)} className="text-text-muted hover:text-white transition-colors">Cancelar</button>
                        </div>
                        
                        <div className="relative flex-1 bg-black/40 overflow-hidden">
                            <Cropper
                                image={imageForCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="p-4 sm:p-6 bg-black/20 shrink-0">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-text-muted font-bold min-w-10">Zoom</span>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e: any) => setZoom(e.target.value)}
                                        className="flex-1 accent-primary"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        onClick={() => setShowCropModal(false)}
                                        className="px-4 py-2 rounded-xl text-text-muted hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmCrop}
                                        className="bg-primary hover:bg-primary-hover text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all"
                                    >
                                        Aplicar Recorte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
