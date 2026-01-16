import React, { useEffect, useState } from 'react';
import api from '../api';
import { User, Plus, Trash2, Key, X, AlertTriangle } from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    is_active: boolean;
    full_name?: string;
    birth_date?: string;
    nickname?: string;
}

const Admin = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Form states
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserBirthDate, setNewUserBirthDate] = useState('');
    const [newUserNickname, setNewUserNickname] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to load users');
        }
    };



    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');



        setLoading(true);

        try {
            await api.post('/users/', {
                email: newUserEmail,
                password: newUserPassword,
                full_name: newUserName,
                birth_date: newUserBirthDate || null,
                nickname: newUserNickname
            });
            setSuccess('Usuário criado com sucesso!');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserName('');
            setNewUserBirthDate('');
            setNewUserNickname('');
            setIsCreateModalOpen(false);
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao criar usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setLoading(true);
        try {
            await api.delete(`/users/${selectedUser.id}`);
            setSuccess(`Usuário ${selectedUser.email} removido com sucesso.`);
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao remover usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        // Clear previous messages
        setError('');
        setSuccess('');



        setLoading(true);
        try {
            await api.put(`/users/${selectedUser.id}/password`, {
                password: newPassword
            });
            setSuccess(`Senha de ${selectedUser.email} atualizada.`);
            setNewPassword('');
            setIsResetModalOpen(false);
            setSelectedUser(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao atualizar senha');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (user: UserData) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
        setError('');
        setSuccess('');
    };

    const openResetModal = (user: UserData) => {
        setSelectedUser(user);
        setIsResetModalOpen(true);
        setNewPassword('');
        setError('');
        setSuccess('');
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        setNewUserBirthDate('');
        setNewUserNickname('');
        setError('');
        setSuccess('');
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in relative">
            <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-primary">Painel do Administrador</h1>

            {error && <div className="bg-danger/10 text-danger p-3 rounded mb-4 text-sm border border-danger/20">{error}</div>}
            {success && <div className="bg-success/10 text-success p-3 rounded mb-4 text-sm border border-success/20">{success}</div>}

            <div className="grid grid-cols-1 gap-8">
                {/* Users List */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <User size={20} className="text-primary" /> Usuários Cadastrados
                        </h2>
                        <button
                            onClick={openCreateModal}
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Adicionar Professor
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                        <div className="space-y-3">
                            {users.map(user => (
                                <div key={user.id} className="p-4 rounded-lg bg-bg-dark/50 border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                                    <div>
                                        <p className="font-medium text-text-main">{user.email}</p>
                                        <p className="text-xs text-text-muted">ID: {user.id} • {user.is_active ? 'Ativo' : 'Inativo'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openResetModal(user)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"
                                            title="Resetar Senha"
                                        >
                                            <Key size={18} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(user)}
                                            className="p-2 hover:bg-danger/20 rounded-lg text-text-muted hover:text-danger transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-6 relative animate-slide-up">
                        <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <Plus size={20} className="text-primary" /> Novo Professor
                        </h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    placeholder="João da Silva"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newUserBirthDate}
                                    onChange={e => setNewUserBirthDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nickname (Apelido)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newUserNickname}
                                    onChange={e => setNewUserNickname(e.target.value)}
                                    placeholder="Prof. João"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    required
                                    placeholder="professor@escola.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Senha Inicial</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    required
                                    placeholder="********"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-text-muted hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-sm p-6 relative animate-slide-up border-danger/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mb-4 text-danger">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Excluir Usuário?</h3>
                            <p className="text-text-muted mb-6">
                                Tem certeza que deseja remover <strong>{selectedUser.email}</strong>? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2 rounded-lg bg-bg-dark border border-white/10 text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={loading}
                                    className="flex-1 py-2 rounded-lg bg-danger hover:bg-danger-hover text-white font-bold shadow-lg shadow-danger/20 transition-colors"
                                >
                                    {loading ? 'Excluindo...' : 'Sim, Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {isResetModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-6 relative animate-slide-up">
                        <button onClick={() => setIsResetModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <Key size={20} className="text-primary" /> Nova Senha
                        </h2>
                        <p className="text-sm text-text-muted mb-4">
                            Defina uma nova senha para <strong>{selectedUser.email}</strong>.
                        </p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nova Senha</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    placeholder="********"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-text-muted hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Salvar' : 'Salvar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
