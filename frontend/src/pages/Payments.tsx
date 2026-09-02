import { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, CheckCircle, AlertCircle, Search, ArrowUp, ArrowDown, Download, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Save } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils/masks';
import { Loading } from '../components/Loading';

interface Student {
    id: number;
    name: string;
    parent_name?: string;
    parent_phone?: string;
    school_year?: string;
    class_type?: string;
    active: boolean;
}

interface Payment {
    id: number;
    student_id: number;
    month: number;
    year: number;
    status: string; // 'PENDING', 'PAID', 'ISENTO', 'LATE'
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
    const [stats, setStats] = useState({ total_students: 0, paid_count: 0, pending_count: 0, exempt_count: 0, total_received: 0 });
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(10);
    const [totalStudents, setTotalStudents] = useState(0);

    const [sortDesc, setSortDesc] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'PAID' | 'PENDING' | 'ISENTO'>('all');

    const [localPayments, setLocalPayments] = useState<Record<number, PaymentInput>>({});
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => { setPage(0); }, [search, filterStatus, sortDesc, selectedMonth, selectedYear]);

    useEffect(() => { fetchData(); }, [selectedMonth, selectedYear, page, filterStatus, sortDesc]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== '') fetchData();
            else fetchData();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const skip = page * limit;
            let studentsUrl = `/students/?skip=${skip}&limit=${limit}&search=${search}&sort_by=name&sort_desc=${sortDesc}&active=true`;

            if (filterStatus !== 'all') {
                studentsUrl += `&payment_status=${filterStatus}&payment_month=${selectedMonth}&payment_year=${selectedYear}`;
            }

            const studentsRes = await api.get(studentsUrl);
            const statsRes = await api.get(`/payments/stats?month=${selectedMonth}&year=${selectedYear}`);
            const paymentsRes = await api.get(`/payments/?year=${selectedYear}&month=${selectedMonth}&limit=2000`);

            setStudents(studentsRes.data.items);
            setTotalStudents(studentsRes.data.total);
            setStats(statsRes.data);

            const initialPayments: Record<number, PaymentInput> = {};
            studentsRes.data.items.forEach((s: Student) => {
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
                const status = p.status;
                const payload = {
                    student_id: p.student_id,
                    month: selectedMonth,
                    year: selectedYear,
                    status,
                    amount: status === 'ISENTO' ? 0 : Number(p.amount),
                    paid_at: status === 'ISENTO' ? null : (p.paid_at || (status === 'PAID' ? new Date().toISOString().split('T')[0] : null))
                };

                if (p.id) {
                    await api.put(`/payments/${p.id}`, payload);
                } else {
                    await api.post('/payments/', payload);
                }
            }));

            showToast('Pagamentos atualizados com sucesso!', 'success');
            fetchData();
        } catch (e) {
            console.error(e);
            showToast('Erro ao salvar os pagamentos', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleExportReport = async () => {
        try {
            const res = await api.post(`/payments/report/docx?month=${selectedMonth}&year=${selectedYear}`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Relatorio_Financeiro_${selectedMonth}_${selectedYear}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            showToast('Erro ao exportar relatório', 'error');
        }
    };

    const { total_students: totalStudentsCount, paid_count: actualPaidCount, pending_count: pendingCount, exempt_count: exemptCount, total_received: totalReceived } = stats;

    return (
        <div className="animate-fade-in pb-12 relative">
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-slide-in text-white font-medium backdrop-blur-2xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-success/80 border-success/50 shadow-success/20' : 'bg-danger/80 border-danger/50 shadow-danger/20'}`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.msg}
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-20">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl opacity-60"></div>
                    <div className="relative flex items-center gap-5">
                        <div className="p-4 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
                            <CreditCard className="text-emerald-400 w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-text-main tracking-tight">
                                Financeiro
                            </h1>
                            <p className="text-text-muted mt-2 text-base font-medium">Controle as mensalidades do mês atual.</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Export */}
                <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/10 shadow-xl w-full md:w-auto">
                    <div className="flex items-center bg-bg-darker/50 rounded-xl px-2 border border-white/5">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as 'all' | 'PAID' | 'PENDING' | 'ISENTO')}
                            className="bg-transparent border-none py-2 px-2 text-sm text-white focus:outline-none cursor-pointer appearance-none [&>option]:bg-bg-dark"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="PAID">Pagos</option>
                            <option value="PENDING">Pendentes</option>
                            <option value="ISENTO">Isentos</option>
                        </select>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

                    <div className="flex items-center bg-bg-darker/50 rounded-xl px-2 border border-white/5">
                        <Calendar size={14} className="text-text-muted ml-2" />
                        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-transparent border-none py-2 px-2 text-sm text-white focus:outline-none cursor-pointer appearance-none">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m} className="bg-bg-dark text-white">{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' })}</option>
                            ))}
                        </select>
                        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-transparent border-none py-2 px-2 text-sm text-white focus:outline-none cursor-pointer appearance-none">
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y} className="bg-bg-dark text-white">{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex-1 sm:flex-none"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-10">
                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/20">
                            <CheckCircle size={18} className="text-indigo-400" />
                        </div>
                        <span className="text-text-muted text-sm font-bold">Total Esperado</span>
                    </div>
                    <p className="text-3xl font-black text-white">{totalStudentsCount}</p>
                </div>

                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/20">
                            <CheckCircle size={18} className="text-emerald-400" />
                        </div>
                        <span className="text-text-muted text-sm font-bold">Pagos</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <p className="text-3xl font-black text-white">{actualPaidCount}</p>
                        <div className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded mb-1">
                            <ArrowUpRight size={12} className="mr-0.5" /> {(totalStudentsCount > 0 ? (actualPaidCount / totalStudentsCount * 100).toFixed(0) : 0)}%
                        </div>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/20">
                            <AlertCircle size={18} className="text-amber-400" />
                        </div>
                        <span className="text-text-muted text-sm font-bold">Pendentes</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <p className="text-3xl font-black text-white">{pendingCount}</p>
                        {pendingCount > 0 && (
                            <div className="flex items-center text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded mb-1">
                                <ArrowDownRight size={12} className="mr-0.5" /> Alerta
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-sky-500/20 rounded-xl border border-sky-500/20">
                            <CheckCircle size={18} className="text-sky-400" />
                        </div>
                        <span className="text-text-muted text-sm font-bold">Isentos</span>
                    </div>
                    <p className="text-3xl font-black text-white">{exemptCount}</p>
                </div>

                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border-emerald-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent z-0"></div>
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all z-0"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2.5 bg-emerald-500/30 rounded-xl border border-emerald-500/40">
                            <DollarSign size={18} className="text-emerald-300" />
                        </div>
                        <span className="text-emerald-400/80 text-sm font-extrabold uppercase tracking-widest">Recebido</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-white relative z-10">{formatCurrency(totalReceived)}</p>
                </div>
            </div>

            {/* Toolbar (Search & Save) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 relative z-20">
                <div className="relative group w-full md:max-w-md">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-500"></div>
                    <div className="relative glass border border-white/10 rounded-2xl flex items-center p-1">
                        <div className="pl-4 pr-3 text-text-muted group-focus-within:text-primary transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar aluno por nome..."
                            className="w-full bg-transparent border-none text-white text-base placeholder-text-muted/60 focus:ring-0 focus:outline-none py-3"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSavePayments}
                    disabled={saving}
                    className={`
                        w-full md:w-auto relative group inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95
                        ${saving ? 'opacity-70 cursor-wait pointer-events-none' : ''}
                    `}
                >
                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity shadow-lg shadow-emerald-500/30"></div>
                    <Save size={18} className="relative z-10" />
                    <span className="relative z-10">{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
            </div>

            {/* Table */}
            <div className="glass-card !p-0 overflow-visible relative flex flex-col min-h-[500px] shadow-2xl shadow-black/50 border border-white/10 rounded-2xl z-10">
                {(loading) && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-dark/50 backdrop-blur-md rounded-2xl">
                        <Loading text="Carregando pagamentos..." />
                    </div>
                )}
                
                <div className="overflow-x-auto flex-1 pb-20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th onClick={() => setSortDesc(!sortDesc)} className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                    <div className="flex items-center gap-2">Aluno {sortDesc ? <ArrowDown size={14} className="text-primary" /> : <ArrowUp size={14} className="text-primary" />}</div>
                                </th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted hidden md:table-cell whitespace-nowrap">Responsável</th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted hidden lg:table-cell whitespace-nowrap">Turma</th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted text-center w-[160px] whitespace-nowrap">Status</th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted text-center w-[160px] whitespace-nowrap">Data Pagto.</th>
                                <th className="p-5 font-semibold text-xs uppercase tracking-wider text-text-muted text-right w-[180px] whitespace-nowrap">Valor Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map(student => {
                                const payment = localPayments[student.id] || { status: 'PENDING', amount: 0, student_id: student.id };
                                const isPaid = payment.status === 'PAID';
                                const isExempt = payment.status === 'ISENTO';
                                return (
                                    <tr key={student.id} className="hover:bg-white/5 transition-all duration-200 group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-colors ${isPaid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : isExempt ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                                                    <span className="font-bold text-sm">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm sm:text-base">{student.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 hidden md:table-cell align-middle">
                                            <div className="text-sm text-white/90">{student.parent_name || '-'}</div>
                                        </td>
                                        <td className="p-5 hidden lg:table-cell align-middle">
                                            <div className="text-sm text-text-muted">{student.school_year || '-'}</div>
                                        </td>
                                        <td className="p-5 align-middle text-center">
                                            <div className="relative">
                                                <select
                                                    className={`w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 outline-none transition-all cursor-pointer backdrop-blur-md ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 focus:ring-emerald-500/40' : isExempt ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 focus:ring-sky-500/40' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 focus:ring-amber-500/40'}`}
                                                    value={payment.status}
                                                    onChange={e => updateLocalPayment(student.id, 'status', e.target.value)}
                                                >
                                                    <option value="PENDING" className="bg-bg-dark text-white">Pendente</option>
                                                    <option value="PAID" className="bg-bg-dark text-white">Pago</option>
                                                    <option value="ISENTO" className="bg-bg-dark text-white">Isento</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <ArrowDown size={14} className={isPaid ? 'text-emerald-400' : isExempt ? 'text-sky-400' : 'text-amber-400'} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 align-middle text-center">
                                            <div className={`relative ${isExempt ? 'opacity-50 grayscale' : ''}`}>
                                                <input
                                                    type="date"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl outline-none py-2.5 px-3 text-sm transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-text-main text-center cursor-pointer disabled:cursor-not-allowed"
                                                    value={payment.paid_at || ''}
                                                    onChange={e => updateLocalPayment(student.id, 'paid_at', e.target.value)}
                                                    disabled={isExempt}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-5 align-middle text-right">
                                            <div className={`relative flex items-center justify-end ${isExempt ? 'opacity-50 grayscale' : ''}`}>
                                                <span className="absolute left-3 text-text-muted font-mono text-sm">R$</span>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl outline-none py-2.5 pl-8 pr-4 text-sm font-mono transition-all text-right focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-text-main placeholder-text-muted/50"
                                                    value={formatCurrency(isExempt ? 0 : payment.amount)}
                                                    onChange={e => updateLocalPayment(student.id, 'amount', parseCurrency(e.target.value))}
                                                    disabled={isExempt}
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-white/30">
                                            <DollarSign size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium">Nenhum aluno no filtro atual</p>
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
        </div>
    );
};
