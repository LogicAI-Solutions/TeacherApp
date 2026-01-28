import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Search, Pencil, Trash, X, AlertTriangle, UserCircle, LineChart as LineChartIcon, Download, MoreVertical, ArrowUp, ArrowDown, Filter, ArrowUpDown } from 'lucide-react';
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
    school?: string;
    intended_profession?: string;
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
    const [totalStudents, setTotalStudents] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Filter & Sort States
    const [sortBy, setSortBy] = useState('name');
    const [sortDesc, setSortDesc] = useState(false);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStudentData, setNewStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', active: true });
    const [selectedClassId, setSelectedClassId] = useState<number | ''>(''); // For enrollment

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentData, setEditStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', active: true });
    const [editClassId, setEditClassId] = useState<number | ''>(''); // Turma atual do aluno no editar
    const [originalClassId, setOriginalClassId] = useState<number | null>(null); // Para detectar mudança

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

    // Reset page when search or filters change
    useEffect(() => {
        setPage(0);
    }, [search, filterActive, sortBy, sortDesc]);

    // Immediate fetch for filters/sort/pagination
    useEffect(() => {
        fetchData();
    }, [page, filterActive, sortBy, sortDesc]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const skip = page * limit;
            let url = `/students/?skip=${skip}&limit=${limit}&search=${search}&sort_by=${sortBy}&sort_desc=${sortDesc}`;

            if (filterActive !== 'all') {
                url += `&active=${filterActive === 'active'}`;
            }

            const res = await api.get(url);
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
            setNewStudentData({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '', school_year: '', school: '', intended_profession: '', class_type: '', active: true });
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

            // Atualizar turma se mudou
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                        <UserCircle className="text-primary" size={20} /> Alunos
                    </h1>
                    <p className="text-text-muted mt-0.5 text-xs sm:text-sm">Gerencie todos os alunos cadastrados.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-button text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                    <Plus size={16} /> Novo Aluno
                </button>
            </div>

            {/* Search Bar & Filters */}
            <div className={`transition-all duration-500 mb-6 sticky top-0 z-10 ${search.length > 0 ? '-translate-y-2 opacity-95' : ''}`}>
                <div className="flex gap-4 max-w-4xl mx-auto">
                    <div className="relative group flex-1">
                        <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-500"></div>
                        <div className="relative glass border border-white/10 rounded-2xl flex items-center p-1">
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
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden relative h-[calc(100vh-280px)] min-h-[400px] flex flex-col">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl">
                        <Loading text="Carregando alunos..." />
                    </div>
                )}
                <div className="overflow-x-auto flex-1 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 sticky top-0 backdrop-blur-xl z-10">
                            <tr>
                                <th
                                    className="text-left p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none"
                                    onClick={() => {
                                        if (sortBy === 'name') setSortDesc(!sortDesc);
                                        else { setSortBy('name'); setSortDesc(false); }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Nome
                                        {sortBy === 'name' ? (
                                            sortDesc ? <ArrowDown size={14} className="text-primary" /> : <ArrowUp size={14} className="text-primary" />
                                        ) : (
                                            <ArrowUpDown size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                        )}
                                    </div>
                                </th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Contato</th>
                                <th
                                    className="text-left p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:text-white transition-colors group select-none"
                                    onClick={() => {
                                        if (sortBy === 'parent_name') setSortDesc(!sortDesc);
                                        else { setSortBy('parent_name'); setSortDesc(false); }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        Responsável
                                        {sortBy === 'parent_name' ? (
                                            sortDesc ? <ArrowDown size={14} className="text-primary" /> : <ArrowUp size={14} className="text-primary" />
                                        ) : (
                                            <ArrowUpDown size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                        )}
                                    </div>
                                </th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">Ano Escolar</th>
                                <th className="text-left p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">Tipo de Aula</th>
                                <th
                                    className="text-center p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none"
                                    onClick={() => {
                                        if (sortBy === 'active') setSortDesc(!sortDesc);
                                        else { setSortBy('active'); setSortDesc(false); }
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Status
                                        {sortBy === 'active' ? (
                                            sortDesc ? <ArrowDown size={14} className="text-primary" /> : <ArrowUp size={14} className="text-primary" />
                                        ) : (
                                            <ArrowUpDown size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                        )}
                                    </div>
                                </th>
                                <th className="text-right p-3 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student, index) => {
                                const isLastItems = students.length > 2 && index >= students.length - 2;
                                return (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 sm:p-4">
                                            <div className="font-medium text-white text-sm sm:text-base">{student.name}</div>
                                            <div className="text-xs text-text-muted md:hidden">{student.phone ? formatPhone(student.phone) : ''}</div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-text-muted text-sm hidden md:table-cell">{student.phone ? formatPhone(student.phone) : '-'}</td>
                                        <td className="p-3 sm:p-4 hidden lg:table-cell">
                                            <div className="text-sm text-white">{student.parent_name || '-'}</div>
                                            <div className="text-xs text-text-muted">{student.parent_phone ? formatPhone(student.parent_phone) : ''}</div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-text-muted text-sm hidden xl:table-cell">{student.school_year || '-'}</td>
                                        <td className="p-3 sm:p-4 text-text-muted text-sm hidden xl:table-cell">{student.class_type || '-'}</td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <select
                                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-medium border focus:ring-2 focus:ring-primary/40 outline-none transition-all cursor-pointer backdrop-blur-sm ${student.active
                                                    ? 'bg-success/10 text-success border-success/30'
                                                    : 'bg-white/5 text-text-muted border-white/10'}`}
                                                value={student.active ? 'true' : 'false'}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={async (e) => {
                                                    const newActive = e.target.value === 'true';
                                                    try {
                                                        await api.put(`/students/${student.id}`, { ...student, active: newActive });
                                                        fetchData();
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Erro ao atualizar status');
                                                    }
                                                }}
                                            >
                                                <option value="true" className="bg-bg-dark text-white">Ativo</option>
                                                <option value="false" className="bg-bg-dark text-white">Inativo</option>
                                            </select>
                                        </td>
                                        <td className="p-3 sm:p-4 text-right relative action-menu-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === student.id ? null : student.id);
                                                }}
                                                className={`p-2 rounded-xl transition-all ${openMenuId === student.id ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === student.id && (
                                                <div className={`absolute right-4 z-50 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${isLastItems ? 'bottom-12 origin-bottom-right' : 'top-12 origin-top-right'}`}>
                                                    <button
                                                        onClick={() => {
                                                            handleViewEvolution(student);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-text-muted hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                                                    >
                                                        <LineChartIcon size={16} /> Ver Evolução
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setEditingStudent(student);
                                                            setEditStudentData({
                                                                name: student.name,
                                                                phone: student.phone || '',
                                                                parent_name: student.parent_name || '',
                                                                parent_phone: student.parent_phone || '',
                                                                parent_email: student.parent_email || '',
                                                                school_year: student.school_year || '',
                                                                school: student.school || '',
                                                                intended_profession: student.intended_profession || '',
                                                                class_type: (student.class_type as any) || '',
                                                                active: student.active ?? true
                                                            });
                                                            // Buscar turma atual do aluno
                                                            try {
                                                                const res = await api.get(`/students/${student.id}/enrollment`);
                                                                setEditClassId(res.data.class_id || '');
                                                                setOriginalClassId(res.data.class_id);
                                                            } catch (e) {
                                                                setEditClassId('');
                                                                setOriginalClassId(null);
                                                            }
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
                <div className="flex justify-between items-center p-4 border-t border-white/5 bg-white/3 backdrop-blur-sm mt-auto">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm text-white transition-all border border-white/10"
                    >
                        Anterior
                    </button>
                    <span className="text-text-muted text-sm">
                        Página {page + 1} de {Math.max(1, Math.ceil(totalStudents / limit))}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * limit >= totalStudents}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm text-white transition-all border border-white/10"
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-lg p-8 animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"><X size={20} /></button>
                        <h3 className="text-2xl font-bold text-white mb-6">Novo Aluno</h3>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input className="glass-input"
                                    value={newStudentData.name} onChange={e => setNewStudentData({ ...newStudentData, name: e.target.value })} required autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input className="glass-input"
                                    value={newStudentData.phone}
                                    onChange={e => setNewStudentData({ ...newStudentData, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(99) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input className="glass-input"
                                        value={newStudentData.parent_name} onChange={e => setNewStudentData({ ...newStudentData, parent_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input className="glass-input"
                                        value={newStudentData.parent_phone}
                                        onChange={e => setNewStudentData({ ...newStudentData, parent_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                        placeholder="(99) 99999-9999" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input type="email" className="glass-input"
                                    value={newStudentData.parent_email} onChange={e => setNewStudentData({ ...newStudentData, parent_email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Ano Escolar</label>
                                    <input className="glass-input"
                                        value={newStudentData.school_year} onChange={e => setNewStudentData({ ...newStudentData, school_year: e.target.value })}
                                        placeholder="Ex: 5º Ano" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Colégio/Escola</label>
                                    <input className="glass-input"
                                        value={newStudentData.school} onChange={e => setNewStudentData({ ...newStudentData, school: e.target.value })}
                                        placeholder="Nome da escola" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Profissão Pretendida</label>
                                    <input className="glass-input"
                                        value={newStudentData.intended_profession} onChange={e => setNewStudentData({ ...newStudentData, intended_profession: e.target.value })}
                                        placeholder="Ex: Engenheiro" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Tipo de Turma</label>
                                    <select className="glass-input"
                                        value={newStudentData.class_type} onChange={e => setNewStudentData({ ...newStudentData, class_type: e.target.value as any })}>
                                        <option value="" className="bg-bg-dark text-white">-- Selecione --</option>
                                        <option value="Semanal" className="bg-bg-dark text-white">Semanal</option>
                                        <option value="Quinzenal" className="bg-bg-dark text-white">Quinzenal</option>
                                    </select>
                                </div>
                            </div>
                            <div
                                className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all backdrop-blur-sm"
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
                                    className="glass-input"
                                    value={selectedClassId}
                                    onChange={e => setSelectedClassId(Number(e.target.value) || '')}
                                >
                                    <option value="" className="bg-bg-dark text-white">-- Selecione uma turma --</option>
                                    {classes.map(c => <option key={c.id} value={c.id} className="bg-bg-dark text-white">{c.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="glass-button text-white px-6 py-2 rounded-xl font-medium">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingStudent && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-lg p-8 animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"><X size={20} /></button>
                        <h3 className="text-2xl font-bold text-white mb-6">Editar Aluno</h3>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input className="glass-input"
                                    value={editStudentData.name} onChange={e => setEditStudentData({ ...editStudentData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input className="glass-input"
                                    value={editStudentData.phone}
                                    onChange={e => setEditStudentData({ ...editStudentData, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(99) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input className="glass-input"
                                        value={editStudentData.parent_name} onChange={e => setEditStudentData({ ...editStudentData, parent_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input className="glass-input"
                                        value={editStudentData.parent_phone}
                                        onChange={e => setEditStudentData({ ...editStudentData, parent_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                        placeholder="(99) 99999-9999" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input type="email" className="glass-input"
                                    value={editStudentData.parent_email} onChange={e => setEditStudentData({ ...editStudentData, parent_email: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Ano Escolar</label>
                                    <input className="glass-input"
                                        value={editStudentData.school_year} onChange={e => setEditStudentData({ ...editStudentData, school_year: e.target.value })}
                                        placeholder="Ex: 5º Ano" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Colégio/Escola</label>
                                    <input className="glass-input"
                                        value={editStudentData.school} onChange={e => setEditStudentData({ ...editStudentData, school: e.target.value })}
                                        placeholder="Nome da escola" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Profissão Pretendida</label>
                                    <input className="glass-input"
                                        value={editStudentData.intended_profession} onChange={e => setEditStudentData({ ...editStudentData, intended_profession: e.target.value })}
                                        placeholder="Ex: Engenheiro" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Tipo de Turma</label>
                                    <select className="glass-input"
                                        value={editStudentData.class_type} onChange={e => setEditStudentData({ ...editStudentData, class_type: e.target.value as any })}>
                                        <option value="" className="bg-bg-dark text-white">-- Selecione --</option>
                                        <option value="Semanal" className="bg-bg-dark text-white">Semanal</option>
                                        <option value="Quinzenal" className="bg-bg-dark text-white">Quinzenal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/10 mt-2">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Turma Matriculada</label>
                                <select
                                    className="glass-input"
                                    value={editClassId}
                                    onChange={e => setEditClassId(Number(e.target.value) || '')}
                                >
                                    <option value="" className="bg-bg-dark text-white">-- Nenhuma turma --</option>
                                    {classes.map(c => <option key={c.id} value={c.id} className="bg-bg-dark text-white">{c.name}</option>)}
                                </select>
                            </div>

                            <div
                                className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all backdrop-blur-sm"
                                onClick={() => setEditStudentData({ ...editStudentData, active: !editStudentData.active })}
                            >
                                <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${editStudentData.active ? 'bg-primary' : 'bg-white/10'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ${editStudentData.active ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                </div>
                                <span className="text-sm font-medium text-white select-none">Aluno Ativo</span>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="glass-button text-white px-6 py-2 rounded-xl font-medium">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evolution Modal */}
            {viewingEvolution && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-4xl p-8 animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0"></div>
                        <button onClick={() => setViewingEvolution(null)} className="absolute top-4 right-4 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"><X size={20} /></button>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-white truncate max-w-[200px] sm:max-w-none">Evolução: {viewingEvolution.name}</h3>
                            <div className="flex items-center gap-2">
                                <select
                                    value={reportMonth}
                                    onChange={e => setReportMonth(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                                >
                                    <option value="" className="bg-bg-dark text-white">Todos</option>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m} className="bg-bg-dark text-white">{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={reportYear}
                                    onChange={e => setReportYear(Number(e.target.value))}
                                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                                    disabled={reportMonth === ''}
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                        <option key={y} value={y} className="bg-bg-dark text-white">{y}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDownloadReport}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-success hover:bg-success/20 rounded-lg transition-all text-xs border border-white/10"
                                    title="Baixar Relatório"
                                >
                                    <Download size={14} />
                                    <span className="hidden sm:inline">Exportar</span>
                                </button>
                            </div>
                        </div>

                        <div id="evolution-chart-container" className="h-[400px] w-full bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                            {filteredEvolutionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={360}>
                                    <LineChart data={filteredEvolutionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="date" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" domain={[0, 10]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
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
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-sm p-6 relative animate-slide-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger/0 via-danger to-danger/0"></div>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-14 h-14 rounded-2xl bg-danger/20 flex items-center justify-center mb-4 text-danger border border-danger/30"><AlertTriangle size={28} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Excluir Aluno?</h3>
                            <p className="text-text-muted mb-6">Tem certeza que deseja excluir <strong className="text-white">{deletingStudent.name}</strong>? Esta ação é irreversível.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-2 text-text-muted hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button onClick={handleDeleteStudent} className="flex-1 py-2 bg-danger/90 hover:bg-danger text-white rounded-xl shadow-lg shadow-danger/30 transition-all font-medium">Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
