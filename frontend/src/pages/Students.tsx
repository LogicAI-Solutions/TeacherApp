import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Search, Pencil, Trash, X, AlertTriangle, UserCircle, Download, MoreVertical, ArrowUp, ArrowDown, ArrowUpDown, Phone, BookOpen, GraduationCap, Calendar, Activity, CheckCircle, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatPhone, unmaskPhone } from '../utils/masks';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Loading } from '../components/Loading';

interface Student {
    id: number;
    name: string;
    phone?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    school_year?: string;
    school?: string;
    intended_profession?: string;
    class_type?: string;
    observation?: string;
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
    const [classes, setClasses] = useState<ClassModel[]>([]);
    const [search, setSearch] = useState('');
    const [schoolYearFilter, setSchoolYearFilter] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(8);
    const [totalStudents, setTotalStudents] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [sortBy, setSortBy] = useState('name');
    const [sortDesc, setSortDesc] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStudentData, setNewStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', observation: '', active: true });
    const [selectedClassId, setSelectedClassId] = useState<number | ''>(''); 

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentData, setEditStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', observation: '', active: true });
    const [editClassId, setEditClassId] = useState<number | ''>(''); 
    const [originalClassId, setOriginalClassId] = useState<number | null>(null); 

    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

    const [viewingEvolution, setViewingEvolution] = useState<Student | null>(null);
    const [evolutionData, setEvolutionData] = useState<EvolutionPoint[]>([]);
    const [reportMonth, setReportMonth] = useState<number | ''>(''); 
    const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId !== null && !(event.target as Element).closest('.action-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    useEffect(() => { fetchClasses(); }, []);

    useEffect(() => { setPage(0); }, [search, schoolYearFilter, sortBy, sortDesc]);

    useEffect(() => { fetchData(); }, [page, sortBy, sortDesc]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { fetchData(); }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, schoolYearFilter]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const skip = page * limit;
            const params = new URLSearchParams({
                skip: String(skip),
                limit: String(limit),
                search,
                sort_by: sortBy,
                sort_desc: String(sortDesc)
            });
            if (schoolYearFilter.trim()) {
                params.set('school_year', schoolYearFilter.trim());
            }

            const res = await api.get(`/students/?${params.toString()}`);
            setStudents(res.data.items);
            setTotalStudents(res.data.total);
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
            setNewStudentData({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', observation: '', active: true });
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

            const newClassId = editClassId === '' ? null : editClassId;
            if (newClassId !== originalClassId) {
                const enrollmentUrl = newClassId
                    ? `/students/${editingStudent.id}/enrollment?class_id=${newClassId}`
                    : `/students/${editingStudent.id}/enrollment`;
                await api.put(enrollmentUrl);
            }

            setEditingStudent(null);
            setEditClassId('');
            setOriginalClassId(null);
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
                const canvas = await html2canvas(chartElement, { backgroundColor: '#1f2937' });
                chartImage = canvas.toDataURL('image/png');
            } catch (err) { console.error("Erro ao capturar gráfico", err); }
        }

        try {
            let requestUrl = `/students/${viewingEvolution.id}/report/docx`;
            if (reportMonth !== '') requestUrl += `?month=${reportMonth}&year=${reportYear}`;

            const response = await api.post(requestUrl, { chart_image: chartImage }, { responseType: 'blob' });

            let datePart = reportMonth !== '' ? `_${reportMonth.toString().padStart(2, '0')}_${reportYear}` : `_${reportYear}`;
            const safeName = viewingEvolution.name.replace(/\s+/g, '_');
            const filename = `Relatorio_${safeName}${datePart}.docx`;

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
        setReportMonth(''); 
        setReportYear(new Date().getFullYear());
        try {
            const res = await api.get(`/students/${student.id}/evolution`);
            setEvolutionData(res.data);
        } catch (e) { console.error(e); alert('Erro ao buscar evolução'); }
    };

    const getFilteredEvolutionData = () => {
        if (reportMonth === '') return evolutionData;
        return evolutionData.filter(d => {
            const date = new Date(d.date);
            return date.getMonth() + 1 === Number(reportMonth) && date.getFullYear() === Number(reportYear);
        });
    };

    const filteredEvolutionData = getFilteredEvolutionData();

    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return <ArrowUpDown size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />;
        return sortDesc ? <ArrowDown size={14} className="text-primary" /> : <ArrowUp size={14} className="text-primary" />;
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(field);
            setSortDesc(false);
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-20">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-xl opacity-50"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
                            <UserCircle className="text-primary w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
                                Alunos
                            </h1>
                            <p className="text-text-muted mt-1 text-sm font-medium">Gestão inteligente do corpo discente</p>
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 w-full md:w-auto"
                >
                    <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-r from-primary to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-r from-primary to-purple-600 blur-lg opacity-40 group-hover:opacity-70 transition-opacity"></div>
                    <Plus size={18} className="relative z-10" />
                    <span className="relative z-10">Cadastrar Aluno</span>
                </button>
            </div>

            {/* Top Toolbar (Filters & Search) */}
            <div className="mb-8 glass-card !p-2 flex flex-col lg:flex-row gap-2 relative z-20">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar por nome do aluno..."
                        className="block w-full pl-12 pr-10 py-3.5 bg-transparent border-none text-white text-base placeholder-text-muted/60 focus:ring-0 focus:outline-none rounded-xl"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white transition-colors">
                            <X size={18} className="bg-white/10 p-1 rounded-full w-6 h-6" />
                        </button>
                    )}
                </div>

                <div className="h-px lg:h-auto lg:w-px bg-white/10 mx-2"></div>

                <div className="relative w-full lg:w-72">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-text-muted" />
                    </div>
                    <select
                        className="block w-full pl-12 pr-10 py-3.5 bg-transparent border-none text-white text-sm focus:ring-0 focus:outline-none rounded-xl appearance-none cursor-pointer"
                        value={schoolYearFilter}
                        onChange={e => setSchoolYearFilter(e.target.value)}
                    >
                        <option value="" className="bg-bg-dark text-white">Todos os Anos Escolares</option>
                        <option value="1º Ano do Ensino Fundamental" className="bg-bg-dark text-white">1º Ano do Ens. Fundamental</option>
                        <option value="2º Ano do Ensino Fundamental" className="bg-bg-dark text-white">2º Ano do Ens. Fundamental</option>
                        <option value="3º Ano do Ensino Fundamental" className="bg-bg-dark text-white">3º Ano do Ens. Fundamental</option>
                        <option value="4º Ano do Ensino Fundamental" className="bg-bg-dark text-white">4º Ano do Ens. Fundamental</option>
                        <option value="5º Ano do Ensino Fundamental" className="bg-bg-dark text-white">5º Ano do Ens. Fundamental</option>
                        <option value="6º Ano do Ensino Fundamental" className="bg-bg-dark text-white">6º Ano do Ens. Fundamental</option>
                        <option value="7º Ano do Ensino Fundamental" className="bg-bg-dark text-white">7º Ano do Ens. Fundamental</option>
                        <option value="8º Ano do Ensino Fundamental" className="bg-bg-dark text-white">8º Ano do Ens. Fundamental</option>
                        <option value="9º Ano do Ensino Fundamental" className="bg-bg-dark text-white">9º Ano do Ens. Fundamental</option>
                        <option value="1º Ano do Ensino Médio" className="bg-bg-dark text-white">1º Ano do Ensino Médio</option>
                        <option value="2º Ano do Ensino Médio" className="bg-bg-dark text-white">2º Ano do Ensino Médio</option>
                        <option value="3º Ano do Ensino Médio" className="bg-bg-dark text-white">3º Ano do Ensino Médio</option>
                        <option value="Pré-Vestibular" className="bg-bg-dark text-white">Pré-Vestibular</option>
                        <option value="Ensino Superior" className="bg-bg-dark text-white">Ensino Superior</option>
                    </select>
                    {schoolYearFilter && (
                        <button onClick={() => setSchoolYearFilter('')} className="absolute inset-y-0 right-8 pr-1 flex items-center text-text-muted hover:text-white transition-colors">
                            <X size={16} className="bg-white/10 p-0.5 rounded-full w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass-card !p-0 overflow-visible relative flex flex-col min-h-[500px] shadow-2xl shadow-black/50 border border-white/10 rounded-2xl z-10">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-dark/50 backdrop-blur-md rounded-2xl">
                        <Loading text="Sincronizando dados..." />
                    </div>
                )}
                
                <div className="overflow-x-auto flex-1 pb-20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th onClick={() => toggleSort('name')} className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                    <div className="flex items-center gap-2">Aluno {renderSortIcon('name')}</div>
                                </th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted hidden md:table-cell whitespace-nowrap">Contato</th>
                                <th onClick={() => toggleSort('parent_name')} className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted hidden lg:table-cell cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                    <div className="flex items-center gap-2">Responsável {renderSortIcon('parent_name')}</div>
                                </th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted hidden xl:table-cell whitespace-nowrap">Ano Escolar</th>
                                <th onClick={() => toggleSort('active')} className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted cursor-pointer hover:text-white transition-colors group select-none text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-2">Status {renderSortIcon('active')}</div>
                                </th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted text-right whitespace-nowrap">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student, index) => {
                                const isLastItems = students.length > 3 && index >= students.length - 3;
                                return (
                                    <tr key={student.id} className="hover:bg-white/5 transition-all duration-200 group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors shrink-0">
                                                    <span className="text-white font-bold text-sm">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm sm:text-base group-hover:text-primary-light transition-colors">{student.name}</div>
                                                    <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1 md:hidden">
                                                        <Phone size={10} /> {student.phone ? formatPhone(student.phone) : 'Sem contato'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 hidden md:table-cell align-middle">
                                            {student.phone ? (
                                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                                    <Phone size={14} className="text-white/40" />
                                                    {formatPhone(student.phone)}
                                                </div>
                                            ) : (
                                                <span className="text-white/20 text-sm italic">Não informado</span>
                                            )}
                                        </td>
                                        <td className="p-5 hidden lg:table-cell align-middle">
                                            {student.parent_name ? (
                                                <div>
                                                    <div className="text-sm font-medium text-white/90">{student.parent_name}</div>
                                                    {student.parent_phone && (
                                                        <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                                                            <Phone size={10} className="text-white/40" /> {formatPhone(student.parent_phone)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-white/20 text-sm italic">Não informado</span>
                                            )}
                                        </td>
                                        <td className="p-5 hidden xl:table-cell align-middle">
                                            {student.school_year ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-sm text-text-muted">
                                                    <BookOpen size={14} className="text-primary/70" />
                                                    {student.school_year}
                                                </div>
                                            ) : (
                                                <span className="text-white/20 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="p-5 align-middle text-center">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await api.put(`/students/${student.id}`, { ...student, active: !student.active });
                                                        fetchData();
                                                    } catch (err) { alert('Erro ao atualizar status'); }
                                                }}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                    student.active 
                                                    ? 'bg-success/10 text-success hover:bg-success/20 border border-success/20' 
                                                    : 'bg-white/5 text-text-muted hover:bg-white/10 border border-white/10'
                                                }`}
                                            >
                                                {student.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {student.active ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="p-5 align-middle text-right relative action-menu-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === student.id ? null : student.id);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${openMenuId === student.id ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-white hover:bg-white/10'}`}
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openMenuId === student.id && (
                                                <div className={`absolute right-6 z-50 w-48 bg-bg-darker/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in ${isLastItems ? 'bottom-10 origin-bottom-right' : 'top-10 origin-top-right'}`}>
                                                    <div className="p-1.5 space-y-0.5">
                                                        <button
                                                            onClick={() => { handleViewEvolution(student); setOpenMenuId(null); }}
                                                            className="w-full text-left px-3 py-2.5 text-sm font-medium text-text-main hover:text-primary-light hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-all"
                                                        >
                                                            <Activity size={16} /> Evolução
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                setEditingStudent(student);
                                                                setEditStudentData({
                                                                    name: student.name, phone: student.phone || '', parent_name: student.parent_name || '', parent_phone: student.parent_phone || '', parent_email: student.parent_email || '', school_year: student.school_year || '', school: student.school || '', intended_profession: student.intended_profession || '', class_type: (student.class_type as any) || '', observation: student.observation || '', active: student.active ?? true
                                                                });
                                                                try {
                                                                    const res = await api.get(`/students/${student.id}/enrollment`);
                                                                    setEditClassId(res.data.class_id || '');
                                                                    setOriginalClassId(res.data.class_id);
                                                                } catch (e) { setEditClassId(''); setOriginalClassId(null); }
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2.5 text-sm font-medium text-text-main hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2.5 transition-all"
                                                        >
                                                            <Pencil size={16} /> Editar Perfil
                                                        </button>
                                                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                                                        <button
                                                            onClick={() => { setDeletingStudent(student); setOpenMenuId(null); }}
                                                            className="w-full text-left px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl flex items-center gap-2.5 transition-all"
                                                        >
                                                            <Trash size={16} /> Excluir
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-white/30">
                                            <UserCircle size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium">Nenhum aluno encontrado</p>
                                            <p className="text-sm mt-1">Ajuste os filtros ou cadastre um novo aluno.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-4 border-t border-white/10 bg-bg-darker/80 backdrop-blur-xl rounded-b-2xl">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-xl text-sm font-medium text-white transition-all border border-white/10 flex items-center gap-2"
                    >
                        Anterior
                    </button>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                        <span className="text-white font-semibold">{page + 1}</span>
                        <span className="text-text-muted text-sm">de</span>
                        <span className="text-white font-semibold">{Math.max(1, Math.ceil(totalStudents / limit))}</span>
                    </div>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * limit >= totalStudents}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 rounded-xl text-sm font-medium text-white transition-all border border-white/10 flex items-center gap-2"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {/* Create & Edit Modals */}
            {(showCreateModal || editingStudent) && (
                <div className="modal-overlay animate-fade-in flex items-center justify-center p-4 z-50">
                    <div className="glass-modal w-full max-w-2xl animate-slide-up relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary z-10"></div>
                        <button onClick={() => { setShowCreateModal(false); setEditingStudent(null); }} className="absolute top-5 right-5 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all z-20 bg-bg-darker/50 backdrop-blur-md">
                            <X size={20} />
                        </button>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                                {editingStudent ? 'Editar Perfil do Aluno' : 'Cadastrar Novo Aluno'}
                            </h3>
                            <p className="text-text-muted text-sm mb-8">Preencha as informações abaixo para manter o cadastro atualizado.</p>
                            
                            <form onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent} className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-white/10 pb-2">Informações Pessoais</h4>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Nome Completo</label>
                                        <input className="glass-input" value={editingStudent ? editStudentData.name : newStudentData.name} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, name: e.target.value }) : setNewStudentData({ ...newStudentData, name: e.target.value })} required autoFocus placeholder="Ex: João da Silva" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Celular do Aluno</label>
                                        <input className="glass-input" value={editingStudent ? editStudentData.phone : newStudentData.phone} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, phone: formatPhone(e.target.value) }) : setNewStudentData({ ...newStudentData, phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(99) 99999-9999" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-white/10 pb-2 mt-6">Dados do Responsável</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Nome do Responsável</label>
                                            <input className="glass-input" value={editingStudent ? editStudentData.parent_name : newStudentData.parent_name} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, parent_name: e.target.value }) : setNewStudentData({ ...newStudentData, parent_name: e.target.value })} placeholder="Ex: Maria da Silva" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Celular do Resp.</label>
                                            <input className="glass-input" value={editingStudent ? editStudentData.parent_phone : newStudentData.parent_phone} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, parent_phone: formatPhone(e.target.value) }) : setNewStudentData({ ...newStudentData, parent_phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(99) 99999-9999" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Email do Responsável</label>
                                        <input type="email" className="glass-input" value={editingStudent ? editStudentData.parent_email : newStudentData.parent_email} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, parent_email: e.target.value }) : setNewStudentData({ ...newStudentData, parent_email: e.target.value })} placeholder="email@exemplo.com" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-white/10 pb-2 mt-6">Dados Acadêmicos</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Ano Escolar</label>
                                            <select className="glass-input cursor-pointer appearance-none" value={editingStudent ? editStudentData.school_year : newStudentData.school_year} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, school_year: e.target.value }) : setNewStudentData({ ...newStudentData, school_year: e.target.value })}>
                                                <option value="" className="bg-bg-dark text-white">-- Selecione --</option>
                                                <option value="1º Ano do Ensino Fundamental" className="bg-bg-dark text-white">1º Ano do Ens. Fundamental</option>
                                                <option value="2º Ano do Ensino Fundamental" className="bg-bg-dark text-white">2º Ano do Ens. Fundamental</option>
                                                <option value="3º Ano do Ensino Fundamental" className="bg-bg-dark text-white">3º Ano do Ens. Fundamental</option>
                                                <option value="4º Ano do Ensino Fundamental" className="bg-bg-dark text-white">4º Ano do Ens. Fundamental</option>
                                                <option value="5º Ano do Ensino Fundamental" className="bg-bg-dark text-white">5º Ano do Ens. Fundamental</option>
                                                <option value="6º Ano do Ensino Fundamental" className="bg-bg-dark text-white">6º Ano do Ens. Fundamental</option>
                                                <option value="7º Ano do Ensino Fundamental" className="bg-bg-dark text-white">7º Ano do Ens. Fundamental</option>
                                                <option value="8º Ano do Ensino Fundamental" className="bg-bg-dark text-white">8º Ano do Ens. Fundamental</option>
                                                <option value="9º Ano do Ensino Fundamental" className="bg-bg-dark text-white">9º Ano do Ens. Fundamental</option>
                                                <option value="1º Ano do Ensino Médio" className="bg-bg-dark text-white">1º Ano do Ensino Médio</option>
                                                <option value="2º Ano do Ensino Médio" className="bg-bg-dark text-white">2º Ano do Ensino Médio</option>
                                                <option value="3º Ano do Ensino Médio" className="bg-bg-dark text-white">3º Ano do Ensino Médio</option>
                                                <option value="Pré-Vestibular" className="bg-bg-dark text-white">Pré-Vestibular</option>
                                                <option value="Ensino Superior" className="bg-bg-dark text-white">Ensino Superior</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Colégio/Escola</label>
                                            <input className="glass-input" value={editingStudent ? editStudentData.school : newStudentData.school} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, school: e.target.value }) : setNewStudentData({ ...newStudentData, school: e.target.value })} placeholder="Nome da instituição" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Profissão Pretendida</label>
                                            <input className="glass-input" value={editingStudent ? editStudentData.intended_profession : newStudentData.intended_profession} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, intended_profession: e.target.value }) : setNewStudentData({ ...newStudentData, intended_profession: e.target.value })} placeholder="Ex: Medicina" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Tipo de Turma</label>
                                            <select className="glass-input cursor-pointer" value={editingStudent ? editStudentData.class_type : newStudentData.class_type} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, class_type: e.target.value }) : setNewStudentData({ ...newStudentData, class_type: e.target.value })}>
                                                <option value="" className="bg-bg-dark text-white">-- Selecione --</option>
                                                <option value="Semanal" className="bg-bg-dark text-white">Semanal</option>
                                                <option value="Quinzenal" className="bg-bg-dark text-white">Quinzenal</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">Observação</label>
                                        <textarea className="glass-input min-h-[100px] resize-y" value={editingStudent ? editStudentData.observation : newStudentData.observation} onChange={e => editingStudent ? setEditStudentData({ ...editStudentData, observation: e.target.value }) : setNewStudentData({ ...newStudentData, observation: e.target.value })} placeholder="Anotações gerais e relevantes sobre o aluno..." />
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-1 block">{editingStudent ? 'Turma Matriculada' : 'Matricular na Turma (Opcional)'}</label>
                                        <select className="glass-input cursor-pointer" value={editingStudent ? editClassId : selectedClassId} onChange={e => editingStudent ? setEditClassId(Number(e.target.value) || '') : setSelectedClassId(Number(e.target.value) || '')}>
                                            <option value="" className="bg-bg-dark text-white">-- Nenhuma turma --</option>
                                            {classes.map(c => <option key={c.id} value={c.id} className="bg-bg-dark text-white">{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 mt-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div 
                                        className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all w-full sm:w-auto group"
                                        onClick={() => editingStudent ? setEditStudentData({ ...editStudentData, active: !editStudentData.active }) : setNewStudentData({ ...newStudentData, active: !newStudentData.active })}
                                    >
                                        <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 shadow-inner ${((editingStudent ? editStudentData.active : newStudentData.active)) ? 'bg-primary' : 'bg-white/20'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-md transition-transform duration-300 ${((editingStudent ? editStudentData.active : newStudentData.active)) ? 'translate-x-[24px]' : 'translate-x-1'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-white select-none">Cadastro Ativo</span>
                                    </div>
                                    
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button type="button" onClick={() => { setShowCreateModal(false); setEditingStudent(null); }} className="flex-1 sm:flex-none px-6 py-3 text-text-muted font-semibold hover:text-white hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                        <button type="submit" className="flex-1 sm:flex-none glass-button text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30">Salvar Dados</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Evolution Modal */}
            {viewingEvolution && (
                <div className="modal-overlay animate-fade-in flex items-center justify-center p-4 z-50">
                    <div className="glass-modal w-full max-w-5xl animate-slide-up relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-primary to-purple-500 z-10"></div>
                        <button onClick={() => setViewingEvolution(null)} className="absolute top-5 right-5 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all z-20 bg-bg-darker/50 backdrop-blur-md">
                            <X size={20} />
                        </button>

                        <div className="p-6 md:p-10 overflow-y-auto flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-white/10 pb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-light rounded-full text-xs font-bold mb-3 border border-primary/30">
                                        <Activity size={14} /> Relatório de Desempenho
                                    </div>
                                    <h3 className="text-3xl font-extrabold text-white truncate max-w-full">{viewingEvolution.name}</h3>
                                    <p className="text-text-muted mt-1 text-sm">Acompanhamento de notas e frequência</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="bg-bg-darker/50 p-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                                        <Calendar size={16} className="text-text-muted ml-2" />
                                        <select
                                            value={reportMonth}
                                            onChange={e => setReportMonth(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer appearance-none py-2 px-2"
                                        >
                                            <option value="" className="bg-bg-dark text-white">Ano Inteiro</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m} className="bg-bg-dark text-white">{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                        <div className="h-4 w-px bg-white/20 mx-1"></div>
                                        <select
                                            value={reportYear}
                                            onChange={e => setReportYear(Number(e.target.value))}
                                            className="bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer appearance-none py-2 px-2"
                                            disabled={reportMonth === ''}
                                        >
                                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                                <option key={y} value={y} className="bg-bg-dark text-white">{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <button
                                        onClick={handleDownloadReport}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success/80 to-emerald-600 hover:from-success hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-success/20 transition-all w-full md:w-auto"
                                    >
                                        <Download size={18} />
                                        <span>Exportar DOCX</span>
                                    </button>
                                </div>
                            </div>

                            <div id="evolution-chart-container" className="h-[450px] w-full bg-bg-darker/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-inner">
                                {filteredEvolutionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={filteredEvolutionData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} axisLine={false} />
                                            <YAxis stroke="#94a3b8" domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                                cursor={{ stroke: 'rgba(139, 92, 246, 0.5)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                            />
                                            <Area type="monotone" dataKey="grade" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorGrade)" activeDot={{ r: 8, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 3 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-text-muted">
                                        <Activity size={48} className="mb-4 opacity-20" />
                                        <p className="text-lg font-medium">Nenhum registro de evolução no período</p>
                                        <p className="text-sm mt-1 text-center max-w-sm">Adicione notas ou avaliações na área da turma para acompanhar o desempenho.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingStudent && (
                <div className="modal-overlay animate-fade-in flex items-center justify-center p-4 z-50">
                    <div className="glass-modal w-full max-w-sm p-8 relative animate-slide-up overflow-hidden border border-danger/30 shadow-2xl shadow-danger/20">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-danger/0 via-danger to-danger/0"></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-6 text-danger shadow-inner">
                                <AlertTriangle size={36} className="animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3">Excluir Aluno</h3>
                            <p className="text-text-muted mb-8 leading-relaxed">
                                Esta ação não pode ser desfeita. Todos os dados de <strong className="text-white bg-white/10 px-2 py-0.5 rounded mx-1">{deletingStudent.name}</strong> serão perdidos para sempre.
                            </p>
                            <div className="flex gap-4 w-full">
                                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-3 text-text-muted font-bold hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button onClick={handleDeleteStudent} className="flex-1 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl shadow-lg shadow-danger/40 transition-all font-bold">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
