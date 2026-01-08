import { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils/masks';
import { Loading } from '../components/Loading';

interface Student {
    id: number;
    name: string;
    parent_name?: string;
    parent_phone?: string;
    school_year?: string;
    class_type?: string;
}

interface Payment {
    id: number;
    student_id: number;
    month: number;
    year: number;
    status: string; // 'PENDING', 'PAID', 'LATE'
    amount: number;
}

interface PaymentInput {
    student_id: number;
    status: string;
    amount: number;
    id?: number;
    paid_at?: string | null;
}

export const Payments = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [allStudentIds, setAllStudentIds] = useState<number[]>([]); // For stats
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    // Search and Pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(10);

    // Local State for Batch Edits
    const [localPayments, setLocalPayments] = useState<Record<number, PaymentInput>>({});
    const [saving, setSaving] = useState(false);

    // Notification
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedMonth, selectedYear, search, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const skip = page * limit;

            // 1. Fetch paginated students for the table
            const studentsRes = await api.get(`/students/?skip=${skip}&limit=${limit}&search=${search}`);

            // 2. Fetch ALL students for accurate Stats (Total & Pending)
            // We use a high limit to ensure we get everyone to count correctly.
            const allStudentsRes = await api.get(`/students/?limit=1000`);

            // 3. Fetch ALL payments for the month (limit 1000)
            const paymentsRes = await api.get(`/payments/?year=${selectedYear}&month=${selectedMonth}&limit=1000`);

            setStudents(studentsRes.data);
            setAllStudentIds(allStudentsRes.data.map((s: Student) => s.id));
            setPayments(paymentsRes.data);

            // Initialize Local State for current page students
            const initialPayments: Record<number, PaymentInput> = {};
            studentsRes.data.forEach((s: Student) => {
                const existing = paymentsRes.data.find((p: Payment) => p.student_id === s.id);
                initialPayments[s.id] = existing ? {
                    ...existing,
                    amount: existing.amount || 0
                } : {
                    student_id: s.id,
                    status: 'PENDING',
                    amount: 0
                };
            });
            setLocalPayments(initialPayments);

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const updateLocalPayment = (studentId: number, field: keyof PaymentInput, value: any) => {
        setLocalPayments(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSavePayments = async () => {
        setSaving(true);
        try {
            const updates = Object.values(localPayments);
            await Promise.all(updates.map(async (p) => {
                // Only save if it's one of the currently visible students to avoid accidental overwrites?
                // Actually we only populate localPayments with current page.

                const payload = {
                    student_id: p.student_id,
                    month: selectedMonth,
                    year: selectedYear,
                    status: p.status,
                    amount: Number(p.amount),
                    paid_at: p.status === 'PAID' ? new Date().toISOString().split('T')[0] : null
                };

                if (p.id) {
                    await api.put(`/payments/${p.id}`, payload);
                } else {
                    await api.post('/payments/', payload);
                }
            }));

            showToast('Pagamentos salvos com sucesso!', 'success');
            fetchData();
        } catch (e) {
            console.error(e);
            showToast('Erro ao salvar pagamentos', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Calculate stats (based on ALL students, not just current page)
    const totalStudents = allStudentIds.length;

    // Paid Count: Payment is PAID AND belongs to a valid student
    const actualPaidCount = payments.filter(p =>
        p.status === 'PAID' && allStudentIds.includes(p.student_id)
    ).length;

    const pendingCount = totalStudents - actualPaidCount;




    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Note: To restore accurate stats, we might need a separate call.
    // For now, let's assume visual correctness of the list is priority.

    const handleExportReport = async () => {
        try {
            const res = await api.post(`/payments/report/docx?month=${selectedMonth}&year=${selectedYear}`, {}, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Financeiro_${selectedMonth}_${selectedYear}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            showToast('Erro ao gerar relatório', 'error');
        }
    };

    return (
        <div className="animate-fade-in relative">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl animate-slide-in text-white font-medium ${toast.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
                <div>
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                        <DollarSign className="text-success" size={20} /> Financeiro
                    </h1>
                    <p className="text-text-muted mt-0.5 text-xs sm:text-sm">Controle de mensalidades.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 bg-bg-card p-2 rounded-xl border border-white/5 w-full md:w-auto">
                    <button
                        onClick={handleExportReport}
                        className="btn-primary-gradient px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                        <DollarSign size={16} /> <span className="hidden sm:inline">Exportar</span> Relatório
                    </button>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-bg-dark border border-white/10 rounded-lg px-2 sm:px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm flex-1 sm:flex-none">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m} className="bg-bg-dark text-white">{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' })}</option>
                        ))}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-bg-dark border border-white/10 rounded-lg px-2 sm:px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm flex-1 sm:flex-none">
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y} className="bg-bg-dark text-white">{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="card-gradient-1 p-3 sm:p-4 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <DollarSign size={16} className="sm:hidden" />
                            <DollarSign size={20} className="hidden sm:block" />
                        </div>
                        <span className="text-text-muted text-xs sm:text-sm font-medium hidden sm:inline">Total Alunos</span>
                    </div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{totalStudents}</p>
                    <p className="text-xs text-indigo-400 mt-0.5 sm:mt-1 font-medium truncate">Alunos</p>
                </div>

                <div className="card-gradient-1 p-3 sm:p-4 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle size={16} className="sm:hidden" />
                            <CheckCircle size={20} className="hidden sm:block" />
                        </div>
                        <span className="text-text-muted text-xs sm:text-sm font-medium hidden sm:inline">Pagos</span>
                    </div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{actualPaidCount}</p>
                    <p className="text-xs text-emerald-400 mt-0.5 sm:mt-1 font-medium truncate">Pagos</p>
                </div>

                <div className="card-gradient-1 p-3 sm:p-4 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <AlertCircle size={16} className="sm:hidden" />
                            <AlertCircle size={20} className="hidden sm:block" />
                        </div>
                        <span className="text-text-muted text-xs sm:text-sm font-medium hidden sm:inline">Pendentes</span>
                    </div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{pendingCount}</p>
                    <p className="text-xs text-amber-400 mt-0.5 sm:mt-1 font-medium truncate">Pendentes</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className={`transition-all duration-500 mb-6 sticky top-0 z-10 ${search.length > 0 ? '-translate-y-2 opacity-95' : ''}`}>
                <div className="relative group max-w-2xl mx-auto shadow-2xl rounded-2xl">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg group-hover:bg-primary/30 transition-all duration-500"></div>
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
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden relative min-h-[400px] flex flex-col justify-between">
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-card/60 backdrop-blur-sm rounded-xl">
                        <Loading text="Carregando financeiro..." />
                    </div>
                )}
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-white">Relatório de {selectedMonth}/{selectedYear}</h3>
                    <button
                        onClick={handleSavePayments}
                        disabled={saving}
                        className={`
                             btn-success-gradient px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm
                             ${saving ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {saving ? 'Salvando...' : <><DollarSign size={16} /> Salvar Alterações</>}
                    </button>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Aluno</th>
                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Responsável</th>
                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">Ano</th>
                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">Tipo</th>
                                <th className="text-center p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[90px] sm:w-[140px]">Status</th>
                                <th className="text-right p-2 sm:p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[80px] sm:w-[140px]">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map(student => {
                                const payment = localPayments[student.id] || { status: 'PENDING', amount: 0, student_id: student.id };
                                const isPaid = payment.status === 'PAID';
                                return (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-2 sm:p-4">
                                            <div className="font-medium text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{student.name}</div>
                                        </td>
                                        <td className="p-2 sm:p-4 hidden md:table-cell">
                                            <div className="text-sm text-text-muted truncate max-w-[120px]">{student.parent_name || '-'}</div>
                                        </td>
                                        <td className="p-2 sm:p-4 text-left text-sm text-text-muted hidden xl:table-cell">{student.school_year || '-'}</td>
                                        <td className="p-2 sm:p-4 text-left text-sm text-text-muted hidden xl:table-cell">{student.class_type || '-'}</td>
                                        <td className="p-2 sm:p-4">
                                            <select
                                                className={`w-full px-2 py-1 sm:p-2 rounded-lg text-xs sm:text-sm border-none focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer ${isPaid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}
                                                value={payment.status}
                                                onChange={e => updateLocalPayment(student.id, 'status', e.target.value)}
                                            >
                                                <option value="PENDING" className="bg-bg-card text-white">Pendente</option>
                                                <option value="PAID" className="bg-bg-card text-white">Pago</option>
                                            </select>
                                        </td>
                                        <td className="p-2 sm:p-4">
                                            <input
                                                type="text"
                                                className={`w-full bg-transparent border-b outline-none py-1 text-xs sm:text-sm font-mono transition-colors text-right ${isPaid
                                                    ? 'border-white/10 focus:border-primary text-white'
                                                    : 'border-transparent text-text-muted cursor-not-allowed'
                                                    }`}
                                                value={formatCurrency(payment.amount)}
                                                onChange={e => updateLocalPayment(student.id, 'amount', parseCurrency(e.target.value))}
                                                disabled={!isPaid}
                                                placeholder="R$ 0"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && !loading && (
                                <tr><td colSpan={6} className="p-8 text-center text-text-muted">Nenhum aluno encontrado.</td></tr>
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
        </div>
    );
};
