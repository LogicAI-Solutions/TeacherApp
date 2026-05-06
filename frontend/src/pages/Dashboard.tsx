import { useEffect, useState } from 'react';
import api from '../api';
import { Loading } from '../components/Loading';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, AlertCircle, Activity, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

interface DashboardStats {
    students: {
        active: number;
        inactive: number;
        total: number;
    };
    payments: {
        current_month: number;
        current_year: number;
        paid: number;
        total_expected: number;
        pending: number;
    };
}

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err: any) {
                console.error("Error fetching dashboard stats:", err);
                setError(err.message || 'Erro ao carregar dados');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center animate-pulse">
                <Loading text="Sincronizando seus indicadores..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={48} className="text-danger" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Ops! Algo deu errado</h2>
                <p className="text-text-muted mb-8 leading-relaxed">Não conseguimos carregar o painel neste momento. Verifique sua conexão e tente novamente.</p>
                <button onClick={() => window.location.reload()} className="glass-button text-white font-bold w-full">Tentar Novamente</button>
            </div>
        );
    }

    if (!stats) return null;

    const studentData = [
        { name: 'Ativos', value: stats.students.active, color: '#8b5cf6' },
        { name: 'Inativos', value: stats.students.inactive, color: '#4b5563' },
    ];

    const paymentData = [
        { name: 'Pagos', value: stats.payments.paid, fill: '#10b981' },
        { name: 'Pendentes', value: stats.payments.pending, fill: '#f59e0b' }, 
    ];

    // Calcula porcentagens
    const percentActive = stats.students.total > 0 ? Math.round((stats.students.active / stats.students.total) * 100) : 0;
    const percentPaid = (stats.payments.paid + stats.payments.pending) > 0 ? Math.round((stats.payments.paid / (stats.payments.paid + stats.payments.pending)) * 100) : 0;

    return (
        <div className="animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-20">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 blur-xl opacity-60"></div>
                    <div className="relative flex items-center gap-5">
                        <div className="p-4 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
                            <Activity className="text-primary w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-text-main tracking-tight">
                                Painel de Bordo
                            </h1>
                            <p className="text-text-muted mt-2 text-base font-medium">Acompanhe a saúde do seu negócio em tempo real.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Total Students Card */}
                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20">
                            <Users size={24} className="text-primary-light" />
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> 100%
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-1">{stats.students.total}</h3>
                        <p className="text-text-muted font-medium text-sm">Total de Alunos</p>
                    </div>
                </div>

                {/* Active Students Card */}
                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/20">
                            <Activity size={24} className="text-purple-400" />
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                            {percentActive}%
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-1">{stats.students.active}</h3>
                        <p className="text-text-muted font-medium text-sm">Alunos Ativos</p>
                    </div>
                </div>

                {/* Payments Card */}
                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                            <Wallet size={24} className="text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                            {percentPaid}%
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-1">{stats.payments.paid}</h3>
                        <p className="text-text-muted font-medium text-sm">Pagamentos Recebidos</p>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="glass-card relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/20">
                            <AlertCircle size={24} className="text-amber-400" />
                        </div>
                        {stats.payments.pending > 0 ? (
                            <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                                <ArrowDownRight size={14} /> Foco Aqui
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={14} /> Limpo
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-white mb-1">{stats.payments.pending}</h3>
                        <p className="text-text-muted font-medium text-sm">Pagamentos Pendentes</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students Chart */}
                <div className="glass-card flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent z-0"></div>
                    <div className="w-full flex items-center justify-between mb-8 z-10 border-b border-white/10 pb-4">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-3">
                            <span className="w-2 h-6 rounded-full bg-primary inline-block"></span>
                            Distribuição de Alunos
                        </h3>
                    </div>
                    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[350px] z-10">
                        <div className="h-[280px] w-full relative flex justify-center">
                            {stats.students.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={studentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {studentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 10px 15px ${entry.color}40)` }} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">Sem dados de alunos</div>
                            )}
                            
                            {/* Inner Circle Label */}
                            {stats.students.total > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-white">{percentActive}%</span>
                                    <span className="text-xs text-text-muted font-medium uppercase tracking-widest mt-1">Ativos</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Custom Legend */}
                        <div className="flex gap-6 mt-4 w-full justify-center">
                            {studentData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm font-medium text-text-muted">{item.name} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payments Chart */}
                <div className="glass-card flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent z-0"></div>
                    <div className="w-full flex items-center justify-between mb-8 z-10 border-b border-white/10 pb-4">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-3">
                            <span className="w-2 h-6 rounded-full bg-emerald-500 inline-block"></span>
                            Balanço Financeiro (Mês)
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-[350px] z-10">
                        {paymentData[0].value > 0 || paymentData[1].value > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart
                                    data={paymentData}
                                    margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                                    barSize={60}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={15} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-text-muted text-sm pb-10">Sem dados financeiros este mês</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
