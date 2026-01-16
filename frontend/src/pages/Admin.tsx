import React, { useEffect, useState } from 'react';
import api from '../api';
import { User, Plus, Trash2, Key, X, AlertTriangle, Edit, Search, Check, Ban } from 'lucide-react';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Form states
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserBirthDate, setNewUserBirthDate] = useState('');
    const [newUserNickname, setNewUserNickname] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Edit form states
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserName, setEditUserName] = useState('');
    const [editUserBirthDate, setEditUserBirthDate] = useState('');
    const [editUserNickname, setEditUserNickname] = useState('');
    const [editUserIsActive, setEditUserIsActive] = useState(true);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [limit] = useState(10);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadUsers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const skip = page * limit;
            const res = await api.get(`/users/?skip=${skip}&limit=${limit}&search=${searchTerm}`);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to load users');
            setError('Erro ao carregar usuários.');
        } finally {
            setLoading(false);
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

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.put(`/users/${selectedUser.id}`, {
                email: editUserEmail,
                full_name: editUserName,
                birth_date: editUserBirthDate || null,
                nickname: editUserNickname,
                is_active: editUserIsActive
            });
            setSuccess('Usuário atualizado com sucesso!');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao atualizar usuário');
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

    const openEditModal = (user: UserData) => {
        setSelectedUser(user);
        setEditUserEmail(user.email);
        setEditUserName(user.full_name || '');
        setEditUserBirthDate(user.birth_date || '');
        setEditUserNickname(user.nickname || '');
        setEditUserIsActive(user.is_active);
        setIsEditModalOpen(true);
        setError('');
        setSuccess('');
    };

    const handleUpdateStatus = async (user: UserData, newStatus: boolean) => {
        try {
            await api.put(`/users/${user.id}`, {
                email: user.email,
                is_active: newStatus
            });
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
            setSuccess(`Status atualizado!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Erro ao atualizar status');
        }
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in relative">
            <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-primary">Painel do Administrador</h1>

            {error && <div className="bg-danger/10 text-danger p-3 rounded mb-4 text-sm border border-danger/20">{error}</div>}
            {success && <div className="bg-success/10 text-success p-3 rounded mb-4 text-sm border border-success/20">{success}</div>}

            <div className="grid grid-cols-1 gap-8">
                {/* Users List with Search and Sort */}
                <div className="glass-card p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <User size={20} className="text-primary" /> Usuários Cadastrados
                        </h2>

                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, email..."
                                    className="w-full pl-10 pr-4 py-2 bg-bg-dark/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={18} /> <span className="hidden md:inline">Adicionar Professor</span><span className="md:hidden">Add</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium sticky top-0 bg-bg-card z-10 w-[25%]">
                                        <div className="flex items-center gap-2">Nome</div>
                                    </th>
                                    <th className="p-4 font-medium sticky top-0 bg-bg-card z-10 w-[20%]">
                                        <div className="flex items-center gap-2">Apelido</div>
                                    </th>
                                    <th className="p-4 font-medium sticky top-0 bg-bg-card z-10 w-[25%]">
                                        <div className="flex items-center gap-2">Email</div>
                                    </th>
                                    <th className="p-4 font-medium text-center">Status</th>
                                    <th className="p-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{user.full_name || '-'}</td>
                                        <td className="p-4 text-text-muted">{user.nickname || '-'}</td>
                                        <td className="p-4 text-text-muted">{user.email}</td>
                                        <td className="p-4 text-center">
                                            <select
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer ${user.is_active
                                                    ? 'bg-success/20 text-success'
                                                    : 'bg-text-muted/20 text-text-muted'}`}
                                                value={user.is_active ? 'true' : 'false'}
                                                onChange={(e) => handleUpdateStatus(user, e.target.value === 'true')}
                                            >
                                                <option value="true" className="bg-bg-card text-white">Ativo</option>
                                                <option value="false" className="bg-bg-card text-white">Inativo</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 hover:bg-primary/20 rounded-lg text-text-muted hover:text-primary transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openResetModal(user)}
                                                    className="p-1.5 hover:bg-warning/20 rounded-lg text-text-muted hover:text-warning transition-colors"
                                                    title="Resetar Senha"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(user)}
                                                    className="p-1.5 hover:bg-danger/20 rounded-lg text-text-muted hover:text-danger transition-colors"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-text-muted">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20 mt-4 rounded-b-lg">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-text-muted text-sm">Página {page + 1}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={users.length < limit}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
                        >
                            Próxima
                        </button>
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

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-6 relative animate-slide-up">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <Edit size={20} className="text-primary" /> Editar Professor
                        </h2>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={editUserName}
                                    onChange={e => setEditUserName(e.target.value)}
                                    placeholder="João da Silva"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={editUserBirthDate}
                                    onChange={e => setEditUserBirthDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nickname (Apelido)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={editUserNickname}
                                    onChange={e => setEditUserNickname(e.target.value)}
                                    placeholder="Prof. João"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={editUserEmail}
                                    onChange={e => setEditUserEmail(e.target.value)}
                                    required
                                    placeholder="professor@escola.com"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={editUserIsActive}
                                        onChange={e => setEditUserIsActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-bg-dark rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    <span className="ml-3 text-sm font-medium text-white">Usuário Ativo</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-text-muted hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
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
