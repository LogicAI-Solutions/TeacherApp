import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Search, Pencil, Trash, X, AlertTriangle, UserCircle, LineChart as LineChartIcon, Download, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatPhone, unmaskPhone } from '../utils/masks';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loading } from '../components/Loading';

interface Student {
    id: number;
    name: string;
    phone?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    school_year?: string;
    class_type?: string;
    active: boolean;
}

interface EvolutionPoint {
    date: string;
    grade: number | null;
    status: string;
}

interface ClassModel {
    id: number;
    name: string;
}

export const Students = () => {
    const [students, setStudents] = useState<Student[]>([]);
    // const [filteredStudents, setFilteredStudents] = useState<Student[]>([]); // Removed: Server side filtering
    const [classes, setClasses] = useState<ClassModel[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(8); // Diminuir para nao ter que ficar scrollando a pagina para baixo para ver mais alunos
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStudentData, setNewStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', class_type: '', active: true });
    const [selectedClassId, setSelectedClassId] = useState<number | ''>(''); // For enrollment

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentData, setEditStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', class_type: '', active: true });

    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

    // Evolution Modal State
    const [viewingEvolution, setViewingEvolution] = useState<Student | null>(null);
    const [evolutionData, setEvolutionData] = useState<EvolutionPoint[]>([]);
    const [reportMonth, setReportMonth] = useState<number | ''>(''); // '' = Todos
    const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

    // Dropdown Menu State
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId !== null && !(event.target as Element).closest('.action-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);


    useEffect(() => {
        fetchClasses();
    }, []);

    // Debounce search and fetch
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, page]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const skip = page * limit;
            const res = await api.get(`/students/?skip=${skip}&limit=${limit}&search=${search}`);
            setStudents(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes/');
            setClasses(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newStudentData,
                phone: unmaskPhone(newStudentData.phone),
                parent_phone: unmaskPhone(newStudentData.parent_phone)
            };
            const res = await api.post('/students/', payload);
            if (selectedClassId) {
                await api.post(`/classes/${selectedClassId}/enroll/${res.data.id}`);
            }
            setShowCreateModal(false);
            setNewStudentData({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', class_type: '', active: true });
            setSelectedClassId('');
            fetchData();
        } catch (e) { alert('Erro ao criar aluno'); }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;
        try {
            const payload = {
                ...editStudentData,
                phone: unmaskPhone(editStudentData.phone),
                parent_phone: unmaskPhone(editStudentData.parent_phone)
            };
            await api.put(`/students/${editingStudent.id}`, payload);
            setEditingStudent(null);
            fetchData();
        } catch (e) { alert('Erro ao atualizar aluno'); }
    };

    const handleDeleteStudent = async () => {
        if (!deletingStudent) return;
        try {
            await api.delete(`/students/${deletingStudent.id}`);
            setDeletingStudent(null);
            fetchData();
        } catch (e) { alert('Erro ao excluir aluno'); }
    };

    const handleDownloadReport = async () => {
        if (!viewingEvolution) return;

        const chartElement = document.getElementById('evolution-chart-container');
        let chartImage = null;

        if (chartElement && evolutionData.length > 0) {
            try {
                // Capture chart with html2canvas
                const canvas = await html2canvas(chartElement, {
                    backgroundColor: '#1f2937' // Match bg-bg-card
                });
                chartImage = canvas.toDataURL('image/png');
            } catch (err) {
                console.error("Erro ao capturar gráfico", err);
            }
        }

        try {
            let requestUrl = `/students/${viewingEvolution.id}/report/docx`;

            if (reportMonth !== '') {
                requestUrl += `?month=${reportMonth}&year=${reportYear}`;
            }

            const response = await api.post(requestUrl, {
                chart_image: chartImage
            }, {
                responseType: 'blob'
            });

            // Construction of filename
            let datePart = '';
            if (reportMonth !== '') {
                datePart = `_${reportMonth.toString().padStart(2, '0')}_${reportYear}`;
            } else {
                datePart = `_${reportYear}`;
            }
            const safeName = viewingEvolution.name.replace(/\s+/g, '_');
            const filename = `Relatorio_${safeName}${datePart}.docx`;

            // Create download link
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar relatório');
        }
    };

    const handleViewEvolution = async (student: Student) => {
        setViewingEvolution(student);
        setEvolutionData([]);
        setReportMonth(''); // Default to All
        setReportYear(new Date().getFullYear());
        try {
            const res = await api.get(`/students/${student.id}/evolution`);
            // Parse dates if necessary, recharts handles strings usually but better ensure
            setEvolutionData(res.data);
        } catch (e) { console.error(e); alert('Erro ao buscar evolução'); }
    };

    // Filter data for chart
    const getFilteredEvolutionData = () => {
        if (reportMonth === '') return evolutionData;
        return evolutionData.filter(d => {
            const date = new Date(d.date);
            // Javascript months are 0-indexed
            return date.getMonth() + 1 === Number(reportMonth) && date.getFullYear() === Number(reportYear);
        });
    };

    const filteredEvolutionData = getFilteredEvolutionData();


    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <UserCircle className="text-primary" size={32} /> Alunos
                    </h1>
                    <p className="text-text-muted mt-1">Gerencie todos os alunos cadastrados.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Novo Aluno
                </button>
            </div>

            {/* Search Bar */}
            <div className={`transition-all duration-500 mb-6 sticky top-0 z-10 ${search.length > 0 ? '-translate-y-2 opacity-95' : ''}`}>
                <div className="relative group max-w-2xl mx-auto shadow-2xl rounded-2xl">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg group-hover:bg-primary/30 transition-all duration-500"></div>
                    <div className="relative bg-bg-card border border-white/5 rounded-2xl flex items-center p-1">
                        <div className="pl-4 pr-3 text-text-muted group-focus-within:text-primary transition-colors">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar aluno por nome..."
                            className="w-full bg-transparent border-none text-white text-lg placeholder-text-muted/50 focus:ring-0 focus:outline-none py-3"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                         {search && (
                            <button onClick={() => setSearch('')} className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all mr-1">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden relative min-h-[400px] flex flex-col justify-between">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-card/60 backdrop-blur-sm rounded-xl">
                        <Loading text="Carregando alunos..." />
                    </div>
                )}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Nome</th>
                                <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Contato</th>
                                <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Responsável</th>
                                <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Ano Escolar</th>
                                <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Tipo de Aula</th>
                                <th className="text-center p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="text-right p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student, index) => {
                                const isLastItems = students.length > 2 && index >= students.length - 2;
                                return (
                                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{student.name}</div>
                                    </td>
                                    <td className="p-4 text-text-muted text-sm">{student.phone ? formatPhone(student.phone) : '-'}</td>
                                    <td className="p-4">
                                        <div className="text-sm text-white">{student.parent_name || '-'}</div>
                                        <div className="text-xs text-text-muted">{student.parent_phone ? formatPhone(student.parent_phone) : ''}</div>
                                    </td>
                                    <td className="p-4 text-text-muted text-sm">{student.school_year || '-'}</td>
                                    <td className="p-4 text-text-muted text-sm">{student.class_type || '-'}</td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${student.active
                                            ? 'bg-success/10 text-success border-success/20'
                                            : 'bg-text-muted/10 text-text-muted border-white/5'}`}>
                                            {student.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {student.active ? 'Ativo' : 'Inativo'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right relative action-menu-container">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === student.id ? null : student.id);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${openMenuId === student.id ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {openMenuId === student.id && (
                                            <div className={`absolute right-4 z-50 w-48 bg-bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in ${isLastItems ? 'bottom-12 origin-bottom-right' : 'top-12 origin-top-right'}`}>
                                                <button
                                                    onClick={() => {
                                                        handleViewEvolution(student);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                                                >
                                                    <LineChartIcon size={16} /> Ver Evolução
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingStudent(student);
                                                        setEditStudentData({
                                                            name: student.name,
                                                            phone: student.phone || '',
                                                            parent_name: student.parent_name || '',
                                                            parent_phone: student.parent_phone || '',
                                                            parent_email: student.parent_email || '',
                                                            school_year: student.school_year || '',
                                                            class_type: (student.class_type as any) || '',
                                                            active: student.active ?? true
                                                        });
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                                                >
                                                    <Pencil size={16} /> Editar
                                                </button>
                                                <div className="h-[1px] bg-white/5 mx-2 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setDeletingStudent(student);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"
                                                >
                                                    <Trash size={16} /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                            {students.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted italic">Nenhum aluno encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
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
                        disabled={students.length < limit}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-card w-full max-w-lg p-8 animate-slide-up relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-white"><X size={20} /></button>
                        <h3 className="text-2xl font-bold text-white mb-6">Novo Aluno</h3>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newStudentData.name} onChange={e => setNewStudentData({ ...newStudentData, name: e.target.value })} required autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newStudentData.phone}
                                    onChange={e => setNewStudentData({ ...newStudentData, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(99) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newStudentData.parent_name} onChange={e => setNewStudentData({ ...newStudentData, parent_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newStudentData.parent_phone}
                                        onChange={e => setNewStudentData({ ...newStudentData, parent_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                        placeholder="(99) 99999-9999" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input type="email" className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={newStudentData.parent_email} onChange={e => setNewStudentData({ ...newStudentData, parent_email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Ano Escolar</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newStudentData.school_year} onChange={e => setNewStudentData({ ...newStudentData, school_year: e.target.value })}
                                        placeholder="Ex: 5º Ano" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Tipo de Turma</label>
                                    <select className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newStudentData.class_type} onChange={e => setNewStudentData({ ...newStudentData, class_type: e.target.value as any })}>
                                        <option value="">-- Selecione --</option>
                                        <option value="Semanal">Semanal</option>
                                        <option value="Quinzenal">Quinzenal</option>
                                    </select>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-3 bg-bg-dark/30 p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-bg-dark/50 transition-colors"
                                onClick={() => setNewStudentData({ ...newStudentData, active: !newStudentData.active })}
                            >
                                <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${newStudentData.active ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ${newStudentData.active ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                </div>
                                <span className="text-sm font-medium text-white select-none">Aluno Ativo</span>
                            </div>

                            <div className="pt-2 border-t border-white/10 mt-2">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Matricular na Turma (Opcional)</label>
                                <select
                                    className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={selectedClassId}
                                    onChange={e => setSelectedClassId(Number(e.target.value) || '')}
                                >
                                    <option value="">-- Selecione uma turma --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-text-muted hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-card w-full max-w-lg p-8 animate-slide-up relative">
                        <button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-white"><X size={20} /></button>
                        <h3 className="text-2xl font-bold text-white mb-6">Editar Aluno</h3>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={editStudentData.name} onChange={e => setEditStudentData({ ...editStudentData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={editStudentData.phone}
                                    onChange={e => setEditStudentData({ ...editStudentData, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(99) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={editStudentData.parent_name} onChange={e => setEditStudentData({ ...editStudentData, parent_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={editStudentData.parent_phone}
                                        onChange={e => setEditStudentData({ ...editStudentData, parent_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                        placeholder="(99) 99999-9999" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input type="email" className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={editStudentData.parent_email} onChange={e => setEditStudentData({ ...editStudentData, parent_email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Ano Escolar</label>
                                    <input className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={editStudentData.school_year} onChange={e => setEditStudentData({ ...editStudentData, school_year: e.target.value })}
                                        placeholder="Ex: 5º Ano" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Tipo de Turma</label>
                                    <select className="w-full p-3 bg-bg-dark/50 border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={editStudentData.class_type} onChange={e => setEditStudentData({ ...editStudentData, class_type: e.target.value as any })}>
                                        <option value="">-- Selecione --</option>
                                        <option value="Semanal">Semanal</option>
                                        <option value="Quinzenal">Quinzenal</option>
                                    </select>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-3 bg-bg-dark/30 p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-bg-dark/50 transition-colors"
                                onClick={() => setEditStudentData({ ...editStudentData, active: !editStudentData.active })}
                            >
                                <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${editStudentData.active ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ${editStudentData.active ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                </div>
                                <span className="text-sm font-medium text-white select-none">Aluno Ativo</span>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-text-muted hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evolution Modal */}
            {viewingEvolution && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-card w-full max-w-4xl p-8 animate-slide-up relative">
                        <button onClick={() => setViewingEvolution(null)} className="absolute top-4 right-4 text-text-muted hover:text-white"><X size={20} /></button>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Evolução: {viewingEvolution.name}</h3>
                            <div className="flex gap-2">
                                <select
                                    value={reportMonth}
                                    onChange={e => setReportMonth(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="bg-bg-dark border border-white/10 rounded-lg px-3 py-1 text-white text-sm"
                                >
                                    <option value="">Todos os Meses</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={reportYear}
                                    onChange={e => setReportYear(Number(e.target.value))}
                                    className="bg-bg-dark border border-white/10 rounded-lg px-3 py-1 text-white text-sm"
                                    disabled={reportMonth === ''}
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDownloadReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success hover:bg-success hover:text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    <Download size={18} />
                                    Baixar Relatório
                                </button>
                            </div>
                        </div>

                        <div id="evolution-chart-container" className="h-[400px] w-full bg-bg-card p-4 rounded-xl">
                            {filteredEvolutionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredEvolutionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                        <XAxis dataKey="date" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" domain={[0, 10]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="grade" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-muted">
                                    Nenhum dado de evolução encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-sm p-6 relative animate-slide-up border-danger/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mb-4 text-danger"><AlertTriangle size={24} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Excluir Aluno?</h3>
                            <p className="text-text-muted mb-6">Tem certeza que deseja excluir <strong>{deletingStudent.name}</strong>? Esta ação é irreversível.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-2 text-text-muted hover:bg-white/5 rounded-lg">Cancelar</button>
                                <button onClick={handleDeleteStudent} className="flex-1 py-2 bg-danger hover:bg-danger-hover text-white rounded-lg">Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
