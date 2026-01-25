import { useEffect, useState } from 'react';
import api from '../api';
import { Loading } from '../components/Loading';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

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

const COLORS = ['#8b5cf6', '#e9ef44ff']; // Primary (Purple) & Danger (Red) for Active/Inactive


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
            <div className="h-[50vh] flex items-center justify-center">
                <Loading text="Carregando dashboard..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[50vh] flex flex-col items-center justify-center text-danger gap-4">
                <AlertCircle size={48} />
                <p className="text-xl">Erro ao carregar dashboard</p>
                <p className="text-text-muted">{error}</p>
                <button onClick={() => window.location.reload()} className="glass-button px-4 py-2 text-white">Tentar Novamente</button>
            </div>
        );
    }

    // Fallback seguro se stats for null por algum motivo estranho, mas sem erro
    if (!stats) return null;

    // Data handling for charts
    const studentData = [
        { name: 'Ativos', value: stats.students.active },
        { name: 'Inativos', value: stats.students.inactive },
    ];

    const paymentData = [
        { name: 'Pagos', value: stats.payments.paid, fill: '#10b981' },
        { name: 'Pendentes', value: stats.payments.pending, fill: '#fbbf24' }, // Usando o calculado no backend ou deduzindo
    ];

    return (
        <div className="animate-slide-up space-y-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Visão Geral
                </h2>
                <p className="text-text-muted mt-2">Acompanhe o desempenho da sua escola em tempo real.</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-primary">
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Total de Alunos</p>
                        <h3 className="text-2xl font-bold text-white">{stats.students.total}</h3>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-success">
                    <div className="p-3 rounded-full bg-success/20 text-success">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Alunos Ativos</p>
                        <h3 className="text-2xl font-bold text-white">{stats.students.active}</h3>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-success">
                    <div className="p-3 rounded-full bg-success/20 text-success">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Pagamentos (Mês)</p>
                        <h3 className="text-2xl font-bold text-white">{stats.payments.paid}</h3>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-warning">
                    <div className="p-3 rounded-full bg-warning/20 text-warning">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Pendentes (Mês)</p>
                        <h3 className="text-2xl font-bold text-white">{stats.payments.pending}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Students Chart */}
                <div className="glass-card p-6 min-h-[350px] sm:min-h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 pl-2 border-l-4 border-primary">Alunos: Ativos vs Inativos</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={studentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {studentData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    isAnimationActive={false}
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
                                                    <p style={{ color: '#fff', margin: 0 }}>
                                                        Quantidade: <span style={{ fontWeight: 'bold' }}>{payload[0].value}</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payments Chart */}
                <div className="glass-card p-6 min-h-[350px] sm:min-h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 pl-2 border-l-4 border-success">Pagamentos do Mês Atual</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={paymentData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Tooltip
                                    isAnimationActive={false}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
                                                    <p style={{ color: '#fff', margin: 0 }}>
                                                        Quantidade: <span style={{ fontWeight: 'bold' }}>{payload[0].value}</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
