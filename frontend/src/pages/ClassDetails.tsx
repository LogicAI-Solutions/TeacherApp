import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Save, Calendar, Users, X, FileText, Pencil, Trash2, AlertTriangle, Eye, Download, RefreshCw } from 'lucide-react';
import { formatPhone, unmaskPhone, formatCurrency, parseCurrency } from '../utils/masks';
import { Loading } from '../components/Loading';
import { ManageStudentsModal } from '../components/ManageStudentsModal';

interface Student {
    id: number;
    name: string;
    phone?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    active?: boolean;
}

interface ClassModel {
    id: string;
    name: string;
    schedule: string;
}

interface AttendanceSession {
    id: number;
    date: string;
    description: string;
    lesson_number: number;
}

interface LogInput {
    student_id: number;
    status: string; // 'present', 'absent'
    essay_delivered: boolean;
    grade: number | '';
    observation: string;
}

interface AttendanceLog {
    id: number;
    student_id: number;
    status: string;
    essay_delivered: boolean;
    grade: number;
    observation: string;
    student?: { name: string };
}

interface SessionDetail extends AttendanceSession {
    logs: AttendanceLog[];
}

interface Payment {
    id: number;
    student_id: number;
    month: number;
    year: number;
    status: string; // 'PENDING', 'PAID', 'LATE'
    amount: number;
    paid_at?: string;
    student?: Student;
}

interface PaymentInput {
    student_id: number;
    status: string;
    amount: number;
    id?: number;
    paid_at?: string | null;
}

export const ClassDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [classData, setClassData] = useState<ClassModel | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);

    const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'history' | 'payments'>('attendance');
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    // Payments Local State
    const [localPayments, setLocalPayments] = useState<Record<number, PaymentInput>>({});
    const [savingPayments, setSavingPayments] = useState(false);

    // New Student Modal State
    const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
    const [newStudentData, setNewStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '' });
    const [creatingStudent, setCreatingStudent] = useState(false);

    // Edit Student State
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentData, setEditStudentData] = useState({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '' });

    // Delete Student State
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

    // Payment State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // History Details State
    const [viewingSession, setViewingSession] = useState<SessionDetail | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);

    // Attendance Form State
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [sessionDesc, setSessionDesc] = useState('');
    const [attendanceLogs, setAttendanceLogs] = useState<Record<number, LogInput>>({});

    // Notification State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchClassData();
        fetchStudents();
        fetchSessions();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'payments') {
            fetchPayments();
        }
    }, [activeTab, selectedMonth, selectedYear]);

    useEffect(() => {
        const initialLogs: Record<number, LogInput> = {};
        students.forEach(s => {
            initialLogs[s.id] = {
                student_id: s.id,
                status: 'present',
                essay_delivered: false,
                grade: '',
                observation: ''
            };
        });
        setAttendanceLogs(prev => ({ ...initialLogs, ...prev }));
    }, [students]);
    useEffect(() => {
        const maxLesson = sessions.reduce((max, s) => Math.max(max, s.lesson_number || 0), 0);
        setSessionDesc(`Aula ${(maxLesson + 1).toString().padStart(2, '0')}`);
    }, [sessions]);

    const fetchClassData = async () => {
        try {
            const res = await api.get(`/classes/${id}`);
            setClassData(res.data);
            setLoadError(false);
        } catch (e: any) {
            console.error(e);
            if (e.response && e.response.status === 404) {
                navigate('/404', { replace: true });
            } else {
                setLoadError(true);
            }
        }
    };

    const handleRetry = () => {
        setLoadError(false);
        fetchClassData();
        fetchStudents();
        fetchSessions();
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/classes/${id}/students`);
            setStudents(res.data);
        } catch (e) {
            console.error(e);
            showNotification('Não foi possível carregar a lista de alunos desta turma. Tente recarregar a página.', 'error');
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/classes/${id}/attendance`);
            setSessions(res.data);
        } catch (e) {
            console.error(e);
            showNotification('Não foi possível carregar o histórico de chamadas desta turma.', 'error');
        }
    };

    const handleEnrollStudent = async (studentId: number) => {
        try {
            await api.post(`/classes/${id}/enroll/${studentId}`);
            fetchStudents();
            showNotification('Aluno matriculado!', 'success');
        } catch (e) { showNotification('Erro ao matricular', 'error'); }
    };

    const handleUnenrollStudent = async (studentId: number) => {
        requestConfirmation(
            'Remover Aluno da Turma?',
            <>Tem certeza que deseja remover este aluno da turma? O histórico de presença <strong>desta turma</strong> será mantido, mas ele não aparecerá mais na lista.</>,
            async () => {
                try {
                    await api.delete(`/classes/${id}/enroll/${studentId}`);
                    fetchStudents();
                    showNotification('Aluno removido da turma!', 'success');
                } catch (e) { showNotification('Erro ao remover aluno', 'error'); }
            },
            'warning'
        );
    };

    const fetchPayments = async () => {
        try {
            // Fetch for all students in this class.
            // Since API filters by student_id or all, we might need a loop or a better API endpoint.
            // Re-using GET /payments/ with year/month filter.
            // It returns ALL payments. We should filter by our students.
            const res = await api.get(`/payments/?year=${selectedYear}&month=${selectedMonth}`);
            // Filter payments for students in this class
            const classStudentIds = students.map(s => s.id);
            const classPayments = res.data.filter((p: Payment) => classStudentIds.includes(p.student_id));

            // Initialize Local State
            const initialPayments: Record<number, PaymentInput> = {};
            students.forEach(s => {
                const existing = classPayments.find((p: Payment) => p.student_id === s.id);
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
    };

    const updateLocalPayment = (studentId: number, field: keyof PaymentInput, value: any) => {
        setLocalPayments(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSavePayments = async () => {
        setSavingPayments(true);
        try {
            const updates = Object.values(localPayments);
            // Process updates sequentially or parallel
            await Promise.all(updates.map(async (p) => {
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
                    // Only create if status is PAID or amount > 0 to avoid spamming empty pendings? 
                    // Verify if backend allows duplicate defaults. current implementation fetches by year/month.
                    // If we save 'PENDING' 0, it creates a record. It's fine.
                    // But to avoid creating 30 records for nothing, maybe check if changed?
                    // For simplicity and "Save" button expectation, we save valid inputs.
                    // Ideally we check if it differs from DB. But let's just Upsert logic.
                    // Our backend create_payment doesn't check existence! It might duplicate.
                    // We should check if p.id exists. If not, create.
                    // But if we have initial 'PENDING' from fetchPayments (which didn't find record), it has no ID.
                    await api.post('/payments/', payload);
                }
            }));

            showNotification('Pagamentos salvos com sucesso!', 'success');
            fetchPayments(); // Refresh to get IDs
        } catch (e) {
            console.error(e);
            showNotification('Erro ao salvar pagamentos', 'error');
        } finally {
            setSavingPayments(false);
        }
    };

    const loadAllStudents = async () => {
        try {
            const res = await api.get('/students/?limit=1000');
            setAllStudents(res.data.items);
            setShowEnrollModal(true);
        } catch (e) { console.error(e); }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentData.name.trim()) return;
        setCreatingStudent(true);

        try {
            const payload = {
                ...newStudentData,
                phone: unmaskPhone(newStudentData.phone),
                parent_phone: unmaskPhone(newStudentData.parent_phone)
            };
            const res = await api.post('/students/', payload);
            await handleEnrollStudent(res.data.id);
            setNewStudentData({ name: '', phone: '', parent_name: '', parent_phone: '', parent_email: '' });
            setShowCreateStudentModal(false);
        } catch (e) { alert('Erro ao criar aluno'); }
        finally { setCreatingStudent(false); }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent || !editStudentData.name.trim()) return;
        try {
            const payload = {
                ...editStudentData,
                phone: unmaskPhone(editStudentData.phone),
                parent_phone: unmaskPhone(editStudentData.parent_phone)
            };
            await api.put(`/students/${editingStudent.id}`, payload);
            setEditingStudent(null);
            fetchStudents();
        } catch (e) { alert('Erro ao atualizar aluno'); }
    };

    const handleDeleteStudent = async () => {
        if (!deletingStudent) return;
        try {
            await api.delete(`/students/${deletingStudent.id}`);
            setDeletingStudent(null);
            fetchStudents();
        } catch (e) { alert('Erro ao excluir aluno'); }
    };

    const downloadFile = async (url: string, filename: string, method: 'GET' | 'POST' = 'GET', body: any = {}) => {
        try {
            const response = method === 'GET'
                ? await api.get(url, { responseType: 'blob' })
                : await api.post(url, body, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            // Ensure filename ends with .docx
            const safeFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
            link.download = safeFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            showNotification("Erro ao baixar o relatório. Tente novamente.", 'error');
        }
    };

    const handleGenerateReport = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        const filename = student ? `Relatorio_${student.name.replace(/\s+/g, '_')}.docx` : 'relatorio.docx';
        // Student report is POST
        downloadFile(`/students/${studentId}/report/docx`, filename, 'POST', {});
    };

    const handleViewSession = async (sessionId: number) => {
        setLoadingSession(true);
        try {
            const res = await api.get(`/attendance-sessions/${sessionId}`);
            // We need to map student names manually if backend doesn't populate nested 'student' object
            // The schemas.AttendanceSession -> logs: List[AttendanceLog]
            // schemas.AttendanceLog includes student_id but maybe not student object unless configured.
            // Let's assume we match by ID from our `students` list if backend missing name.
            const sessionData = res.data;
            setViewingSession(sessionData);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao carregar detalhes da aula.", 'error');
        } finally {
            setLoadingSession(false);
        }
    };

    const handleGenerateSessionReport = (sessionId: number) => {
        const session = sessions.find(s => s.id === sessionId);
        const dateStr = session ? session.date : 'aula';
        downloadFile(`/attendance-sessions/${sessionId}/report/docx`, `Aula_${dateStr}.docx`);
    };

    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    } | null>(null);

    const requestConfirmation = (title: string, message: React.ReactNode, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmation({ isOpen: true, title, message, onConfirm, type });
    };

    const handleDeleteSession = async (sessionId: number) => {
        try {
            await api.delete(`/classes/${id}/attendance/${sessionId}`);
            showNotification('Chamada excluída com sucesso!', 'success');
            setViewingSession(null);

            // If we deleted the session currently being edited, clear the form
            if (editingSessionId === sessionId) {
                setEditingSessionId(null);
                setSessionDesc('');
                // Reset to default empty logs
                const initialLogs: Record<number, LogInput> = {};
                students.forEach(s => {
                    initialLogs[s.id] = {
                        student_id: s.id,
                        status: 'present',
                        essay_delivered: false,
                        grade: '',
                        observation: ''
                    };
                });
                setAttendanceLogs(initialLogs);
            }

            fetchSessions();
        } catch (e) {
            console.error(e);
            showNotification('Erro ao excluir chamada', 'error');
        }
    };

    const handleEditSession = (session: SessionDetail) => {
        setSessionDesc(session.description);
        setSessionDate(session.date);
        setEditingSessionId(session.id);

        const newLogs: Record<number, LogInput> = {};
        // Initialize logs for all students first
        students.forEach(s => {
            newLogs[s.id] = {
                student_id: s.id,
                status: 'present',
                essay_delivered: false,
                grade: '',
                observation: ''
            };
        });

        // Overwrite with existing session logs
        session.logs.forEach(log => {
            newLogs[log.student_id] = {
                student_id: log.student_id,
                status: log.status,
                essay_delivered: log.essay_delivered,
                grade: log.grade === null ? '' : log.grade,
                observation: log.observation || ''
            };
        });

        setAttendanceLogs(newLogs);
        setViewingSession(null);
        setActiveTab('attendance');
    };

    const handleSaveAttendance = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Saving attendance...");

        if (!sessionDesc) {
            showNotification('Por favor, descreva a aula (ex: Aula 10)', 'warning');
            return;
        }

        setSaving(true);

        let logsToProcess = Object.values(attendanceLogs).filter(l => students.find(s => s.id === l.student_id));

        // Se for nova chamada, não salvar presença para alunos inativos
        if (!editingSessionId) {
            logsToProcess = logsToProcess.filter(l => {
                const s = students.find(std => std.id === l.student_id);
                return s?.active !== false;
            });
        }

        const payload = {
            date: sessionDate,
            description: sessionDesc,
            logs: logsToProcess.map(l => {
                const gradeNum = l.grade === '' ? null : Number(l.grade);
                return {
                    ...l,
                    grade: isNaN(gradeNum as number) ? null : gradeNum
                };
            })
        };

        try {
            if (editingSessionId) {
                await api.put(`/classes/${id}/attendance/${editingSessionId}`, payload);
                showNotification('Chamada atualizada com sucesso!', 'success');
            } else {
                await api.post(`/classes/${id}/attendance`, payload);
                showNotification('Chamada salva com sucesso!', 'success');
            }

            setSessionDesc('');
            setEditingSessionId(null);

            const initialLogs: Record<number, LogInput> = {};
            students.forEach(s => {
                initialLogs[s.id] = {
                    student_id: s.id,
                    status: 'present',
                    essay_delivered: false,
                    grade: '',
                    observation: ''
                };
            });
            setAttendanceLogs(initialLogs);
            fetchSessions();
            setActiveTab('history');
        } catch (e: any) {
            console.error(e);
            console.log(e.response); // Debug
            const msg = e.response?.data?.detail || (e.response?.status === 500 && e.response?.data?.detail?.includes("Duplicate") ? "Já existe uma chamada para esta data." : 'Erro ao salvar chamada');
            showNotification(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const updateLog = (studentId: number, field: keyof LogInput, value: any) => {
        setAttendanceLogs(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    // Helper to get student name
    const getStudentName = (id: number) => {
        return students.find(s => s.id === id)?.name || "Aluno Removido";
    };

    if (loadError) return (
        <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={48} className="text-danger" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Não foi possível abrir a turma</h2>
            <p className="text-text-muted mb-8 leading-relaxed">
                Houve um problema ao carregar as informações desta turma. Verifique sua conexão com a internet e tente novamente.
            </p>
            <button onClick={handleRetry} className="glass-button text-white font-bold flex items-center gap-2 px-6 py-3 rounded-xl">
                <RefreshCw size={18} /> Tentar Novamente
            </button>
        </div>
    );

    if (!classData) return (
        <div className="h-screen flex items-center justify-center">
            <Loading text="Carregando dados da turma..." />
        </div>
    );

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-slide-in flex items-center gap-3 ${toast.type === 'success' ? 'bg-success/20 border-success/30 text-white' :
                    toast.type === 'error' ? 'bg-danger/20 border-danger/30 text-white' :
                        'bg-yellow-500/20 border-yellow-500/30 text-white'
                    }`}>
                    {toast.type === 'success' && <div className="p-1 bg-success rounded-full flex items-center justify-center"><Save size={14} /></div>}
                    {toast.type === 'error' && <div className="p-1 bg-danger rounded-full flex items-center justify-center"><AlertTriangle size={14} /></div>}
                    {toast.type === 'warning' && <div className="p-1 bg-yellow-500 rounded-full flex items-center justify-center"><AlertTriangle size={14} /></div>}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide opacity-80">
                            {toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Atenção'}
                        </h4>
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">{classData.name}</h1>
                    <p className="text-primary-light flex items-center gap-2 mt-2 font-medium bg-primary/10 w-fit px-3 py-1 rounded-full text-sm">
                        <Calendar size={14} /> {classData.schedule}
                    </p>
                </div>
                <div className="bg-bg-card/50 p-1 rounded-lg flex gap-1 w-full md:w-auto overflow-x-auto">
                    {['attendance', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize flex-1 md:flex-none text-center ${activeTab === tab
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab === 'attendance' ? 'Chamada' : 'Histórico'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-slide-up">
                {activeTab === 'students' && (
                    <div className="glass-card">
                        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4 border-b border-white/5 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-primary" size={20} /> Alunos Matriculados <span className="bg-bg-dark px-2 py-0.5 rounded-full text-xs text-text-muted">{students.length}</span></h2>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={loadAllStudents} className="btn btn-outline"><Users size={16} /> Gerenciar Alunos</button>
                                <button onClick={() => setShowCreateStudentModal(true)} className="btn btn-primary shadow-lg shadow-primary/20"><Plus size={16} /> Novo Aluno</button>
                            </div>
                        </div>
                        <div className="table-container bg-transparent border-none">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-text-muted font-semibold uppercase text-xs tracking-wider">Nome do Aluno</th>
                                        <th className="text-left p-4 text-text-muted font-semibold uppercase text-xs tracking-wider">Matrícula</th>
                                        <th className="text-right p-4 text-text-muted font-semibold uppercase text-xs tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-medium text-text-main">{s.name}</td>
                                            <td className="p-4 text-text-muted text-sm">#{s.id.toString().padStart(4, '0')}</td>
                                            <td className="p-4 flex gap-2 justify-end">
                                                <button onClick={() => handleGenerateReport(s.id)} className="p-2 hover:bg-primary/20 text-text-muted hover:text-primary rounded-lg transition-colors" title="Gerar Relatório Individual">
                                                    <FileText size={16} />
                                                </button>
                                                <button onClick={() => {
                                                    setEditingStudent(s);
                                                    setEditStudentData({
                                                        name: s.name,
                                                        phone: s.phone || '',
                                                        parent_name: s.parent_name || '',
                                                        parent_phone: s.parent_phone || '',
                                                        parent_email: s.parent_email || ''
                                                    });
                                                }} className="p-2 hover:bg-white/10 text-text-muted hover:text-white rounded-lg transition-colors" title="Editar">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => setDeletingStudent(s)} className="p-2 hover:bg-danger/20 text-text-muted hover:text-danger rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-text-muted italic">Nenhum aluno matriculado nesta turma.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="glass-card p-4">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-text-main">
                                <span className="w-2 h-8 bg-primary rounded-full"></span> Nova Chamada
                            </h2>
                            <div className="flex items-center gap-3">
                                <button onClick={loadAllStudents} className="btn btn-outline">
                                    <Users size={16} /> Gerenciar Alunos
                                </button>
                                <div className="text-sm text-text-muted bg-bg-dark px-3 py-1 rounded-lg border border-white/5">
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Descrição</label>
                                <input className="glass-input" value={sessionDesc} onChange={e => setSessionDesc(e.target.value)} placeholder="Ex: Introdução à Álgebra (Aula 01)" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Data</label>
                                <input type="date" className="glass-input" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-white/8 bg-white/3">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-white/5">
                                            <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider min-w-[200px]">Aluno</th>
                                            <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[150px]">Status</th>
                                            <th className="text-center p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[150px]">Trabalho Entregue?</th>
                                            <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[120px]">Nota</th>
                                            <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider min-w-[250px]">Obs</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[...students].filter(s => s.active !== false).sort((a, b) => a.name.localeCompare(b.name)).map(s => {
                                            const log = attendanceLogs[s.id] || {};
                                            return (
                                                <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-4 font-medium text-text-main">{s.name}</td>
                                                    <td className="p-4">
                                                        <select
                                                            className={`w-full p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer ${log.status === 'present' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}
                                                            value={log.status}
                                                            onChange={e => updateLog(s.id, 'status', e.target.value)}
                                                        >
                                                            <option value="present" className="bg-bg-card text-white">Presente</option>
                                                            <option value="absent" className="bg-bg-card text-white">Ausente</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => updateLog(s.id, 'essay_delivered', !log.essay_delivered)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold ring-1 transition-all ${log.essay_delivered
                                                                ? 'bg-primary/20 text-primary ring-primary/30 hover:bg-primary/30'
                                                                : 'bg-white/5 text-text-muted ring-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {log.essay_delivered ? 'Sim' : 'Não'}
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="number"
                                                            className={`w-full bg-transparent border-b outline-none py-1 text-sm text-center font-mono transition-colors ${log.essay_delivered
                                                                ? 'border-white/10 focus:border-primary text-primary-light placeholder-text-muted/30'
                                                                : 'border-transparent text-text-muted/20 cursor-not-allowed'
                                                                }`}
                                                            value={log.grade === undefined ? '' : log.grade}
                                                            onChange={e => updateLog(s.id, 'grade', e.target.value)}
                                                            placeholder={log.essay_delivered ? '-' : ''}
                                                            disabled={!log.essay_delivered}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            className="w-full bg-transparent border-b border-white/10 focus:border-primary outline-none py-1 text-sm text-text-muted focus:text-white placeholder-text-muted/30 transition-colors"
                                                            value={log.observation || ''}
                                                            onChange={e => updateLog(s.id, 'observation', e.target.value)}
                                                            placeholder="Observação..."
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {students.length > 0 && (
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSaveAttendance}
                                    disabled={saving}
                                    className={`
                                        bg-gradient-to-r from-primary to-primary-hover text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 
                                        transition-all flex items-center gap-2
                                        ${saving ? 'opacity-70 cursor-wait' : 'hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0'}
                                    `}
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} /> Salvar Chamada
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {activeTab === 'history' && (
                <div className="grid gap-4">
                    {sessions
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((sess, index) => {
                            const dynamicLabel = `Aula ${String(index + 1).padStart(2, '0')}`;
                            const displayTitle = sess.description?.match(/^Aula \d+$/) ? dynamicLabel : sess.description;
                            return (
                                <div key={sess.id} className="glass-card p-4 hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{displayTitle}</h3>
                                            <p className="text-text-muted text-sm">{sess.date}</p>
                                        </div>
                                        <button onClick={() => handleViewSession(sess.id)} disabled={loadingSession} className="text-primary hover:text-white cursor-pointer transition-colors px-3 py-1 bg-white/5 rounded-lg text-sm flex items-center gap-2">
                                            <Eye size={16} /> Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    {sessions.length === 0 && (
                        <div className="glass-card p-8 text-center text-text-muted italic">
                            Nenhuma chamada registrada até o momento.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="glass-card">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-text-main">
                            <span className="w-2 h-8 bg-success rounded-full"></span> Mensalidades
                        </h2>
                        <div className="flex gap-2">
                            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="glass-input py-1 px-3">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="glass-input py-1 px-3">
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-container bg-transparent border-none">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[200px]">Status</th>
                                    <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-[200px]">Valor Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {students.map(s => {
                                    const payment = localPayments[s.id] || { status: 'PENDING', amount: 0, student_id: s.id };
                                    const isPaid = payment.status === 'PAID';
                                    return (
                                        <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 font-medium text-text-main">{s.name}</td>
                                            <td className="p-4 text-text-muted text-sm">
                                                <div className="flex flex-col">
                                                    <span>{s.parent_name || '-'}</span>
                                                    <span className="text-xs opacity-50">{s.parent_phone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    className={`w-full p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer ${isPaid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}
                                                    value={payment.status}
                                                    onChange={e => updateLocalPayment(s.id, 'status', e.target.value)}
                                                >
                                                    <option value="PENDING" className="bg-bg-card text-white">Pendente</option>
                                                    <option value="PAID" className="bg-bg-card text-white">Pago</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className={`w-full bg-transparent border-b outline-none py-1 text-sm font-mono transition-colors text-right ${isPaid
                                                            ? 'border-white/10 focus:border-primary text-white'
                                                            : 'border-transparent text-text-muted cursor-not-allowed'
                                                            }`}
                                                        value={formatCurrency(payment.amount)}
                                                        onChange={e => updateLocalPayment(s.id, 'amount', parseCurrency(e.target.value))}
                                                        disabled={!isPaid}
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSavePayments}
                            disabled={savingPayments}
                            className={`
                                bg-gradient-to-r from-success to-success-hover text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-success/25 
                                transition-all flex items-center gap-2
                                ${savingPayments ? 'opacity-70 cursor-wait' : 'hover:shadow-success/40 hover:-translate-y-1 active:translate-y-0'}
                            `}
                        >
                            {savingPayments ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} /> Salvar Pagamentos
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {/* ... Other modals (Enroll, Create, Edit, Delete) same as before ... */}
            {/* Enrollment Modal */}
            {/* Manage Students Modal */}
            {/* Manage Students Modal */}
            <ManageStudentsModal
                isOpen={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
                students={allStudents}
                enrolledStudentIds={students.map(s => s.id)}
                onEnroll={handleEnrollStudent}
                onUnenroll={handleUnenrollStudent}
            />

            {/* Create Student Modal */}
            {showCreateStudentModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-md animate-slide-up relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <button onClick={() => setShowCreateStudentModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-main p-2 rounded-xl hover:bg-white/10 transition-all z-10">
                            <X size={20} />
                        </button>
                        <div className="p-8 overflow-y-auto flex-1">
                        <h3 className="text-xl mb-6 font-bold text-text-main flex items-center gap-2">
                            <Plus size={20} className="text-primary" /> Novo Aluno
                        </h3>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    className="glass-input mt-1"
                                    value={newStudentData.name}
                                    onChange={e => setNewStudentData({ ...newStudentData, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input
                                    className="glass-input mt-1"
                                    value={newStudentData.phone}
                                    onChange={e => setNewStudentData({ ...newStudentData, phone: formatPhone(e.target.value) })}
                                    maxLength={15}
                                    placeholder="(99) 99999-9999"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input
                                        className="glass-input mt-1"
                                        value={newStudentData.parent_name}
                                        onChange={e => setNewStudentData({ ...newStudentData, parent_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input
                                        className="glass-input mt-1"
                                        value={newStudentData.parent_phone}
                                        onChange={e => setNewStudentData({ ...newStudentData, parent_phone: formatPhone(e.target.value) })}
                                        maxLength={15}
                                        placeholder="(99) 99999-9999"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input
                                    type="email"
                                    className="glass-input mt-1"
                                    value={newStudentData.parent_email}
                                    onChange={e => setNewStudentData({ ...newStudentData, parent_email: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreateStudentModal(false)} className="px-4 py-2 rounded-xl text-text-muted hover:bg-white/10 transition-colors">Cancelar</button>
                                <button type="submit" disabled={creatingStudent} className="glass-button text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50">
                                    {creatingStudent ? 'Criando...' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-md animate-slide-up relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-main p-2 rounded-xl hover:bg-white/10 transition-all z-10">
                            <X size={20} />
                        </button>
                        <div className="p-8 overflow-y-auto flex-1">
                        <h3 className="text-xl mb-6 font-bold text-text-main flex items-center gap-2">
                            <Pencil size={20} className="text-primary" /> Editar Aluno
                        </h3>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome Completo</label>
                                <input className="glass-input mt-1" value={editStudentData.name} onChange={e => setEditStudentData({ ...editStudentData, name: e.target.value })} required autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Celular</label>
                                <input className="glass-input mt-1" value={editStudentData.phone} onChange={e => setEditStudentData({ ...editStudentData, phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(99) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Responsável</label>
                                    <input className="glass-input mt-1" value={editStudentData.parent_name} onChange={e => setEditStudentData({ ...editStudentData, parent_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Cel. Responsável</label>
                                    <input className="glass-input mt-1" value={editStudentData.parent_phone} onChange={e => setEditStudentData({ ...editStudentData, parent_phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(99) 99999-9999" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Email Responsável</label>
                                <input type="email" className="glass-input mt-1" value={editStudentData.parent_email} onChange={e => setEditStudentData({ ...editStudentData, parent_email: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 rounded-xl text-text-muted hover:bg-white/10 transition-colors">Cancelar</button>
                                <button type="submit" className="glass-button text-white px-6 py-2 rounded-xl font-medium">Salvar</button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Student Modal */}
            {deletingStudent && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-sm p-6 relative animate-slide-up overflow-hidden border-danger/30">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger/0 via-danger to-danger/0"></div>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mb-4 text-danger border border-danger/30">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">Excluir Aluno?</h3>
                            <p className="text-text-muted mb-6">
                                Tem certeza que deseja remover <strong className="text-text-main">{deletingStudent.name}</strong>? Todo o histórico de presença será apagado.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-2 rounded-xl text-text-muted hover:bg-white/10 transition-colors">Cancelar</button>
                                <button onClick={handleDeleteStudent} className="flex-1 py-2 rounded-xl bg-danger/90 hover:bg-danger text-white font-bold shadow-lg shadow-danger/30 transition-all">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Details Modal */}
            {viewingSession && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-2xl max-h-[85vh] overflow-y-auto relative animate-slide-up flex flex-col">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>

                        {/* Header */}
                        <div className="p-6 border-b border-white/8 flex justify-between items-start sticky top-0 z-10 glass-header rounded-tl-3xl rounded-tr-3xl">
                            <div>
                                <h3 className="text-xl font-bold text-text-main mb-1">{viewingSession.description}</h3>
                                <p className="text-text-muted text-sm flex items-center gap-2">
                                    <Calendar size={14} /> {viewingSession.date}
                                </p>
                            </div>
                            <button onClick={() => setViewingSession(null)} className="text-text-muted hover:text-text-main transition-colors p-2 rounded-xl hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        <th className="py-3 px-2 text-text-muted font-medium">Aluno</th>
                                        <th className="py-3 px-2 text-text-muted font-medium">Status</th>
                                        <th className="py-3 px-2 text-text-muted font-medium">Nota</th>
                                        <th className="py-3 px-2 text-text-muted font-medium">Observação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {viewingSession.logs
                                        .sort((a, b) => {
                                            const nameA = a.student?.name || getStudentName(a.student_id);
                                            const nameB = b.student?.name || getStudentName(b.student_id);
                                            return nameA.localeCompare(nameB);
                                        })
                                        .map(log => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-2 font-medium text-text-main">{log.student?.name || getStudentName(log.student_id)}</td>
                                                <td className="py-3 px-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'present' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'present' ? 'bg-success' : 'bg-danger'}`}></span>
                                                        {log.status === 'present' ? 'Presente' : 'Ausente'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-text-muted">{log.grade !== null ? log.grade : '—'}</td>
                                                <td className="py-3 px-2 text-text-muted truncate max-w-[150px]" title={log.observation}>{log.observation || '—'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => {
                                    requestConfirmation(
                                        'Excluir Chamada?',
                                        <>Tem certeza que deseja excluir a chamada de <strong>{viewingSession.description}</strong>? Esta ação não pode ser desfeita.</>,
                                        () => handleDeleteSession(viewingSession.id),
                                        'danger'
                                    );
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Excluir
                            </button>
                            <button
                                onClick={() => handleEditSession(viewingSession)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-main hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 flex items-center justify-center gap-2"
                            >
                                <Pencil size={16} /> Editar
                            </button>
                            <button onClick={() => handleGenerateSessionReport(viewingSession.id)} className="glass-button px-4 py-2 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2">
                                <Download size={16} /> Relatório
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmation && confirmation.isOpen && (
                <div className="modal-overlay animate-fade-in" style={{zIndex: 100}}>
                    <div className={`glass-modal w-full max-w-sm p-6 relative animate-slide-up overflow-hidden ${confirmation.type === 'danger' ? 'border-danger/30' : 'border-white/10'}`}>
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${confirmation.type === 'danger' ? 'from-danger/0 via-danger to-danger/0' : 'from-primary/0 via-primary to-primary/0'}`}></div>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmation.type === 'danger' ? 'bg-danger/20 text-danger border border-danger/30' :
                                confirmation.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                    'bg-primary/20 text-primary border border-primary/30'
                                }`}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">{confirmation.title}</h3>
                            <div className="text-text-muted mb-6 text-sm">
                                {confirmation.message}
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmation(null)}
                                    className="flex-1 py-2 rounded-xl text-text-muted hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        confirmation.onConfirm();
                                        setConfirmation(null);
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-white font-bold shadow-lg transition-colors ${confirmation.type === 'danger' ? 'bg-danger/90 hover:bg-danger shadow-danger/20' :
                                        confirmation.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20' :
                                            'bg-primary hover:bg-primary-hover shadow-primary/20'
                                        }`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
