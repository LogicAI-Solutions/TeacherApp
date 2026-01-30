import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Calendar, Pencil, Trash, X, AlertTriangle, GripVertical, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../components/Loading';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ClassModel {
    id: number;
    name: string;
    schedule: string;
    display_order?: number;
}

interface SortableClassCardProps {
    cls: ClassModel;
    index: number;
    isReorderMode: boolean;
    openEditModal: (e: React.MouseEvent, cls: ClassModel) => void;
    openDeleteModal: (e: React.MouseEvent, cls: ClassModel) => void;
}

const SortableClassCard = ({ cls, index, isReorderMode, openEditModal, openDeleteModal }: SortableClassCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: cls.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        animationDelay: `${index * 100}ms`,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    const cardContent = (
        <>
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex justify-between items-start p-6">
                <div className="flex items-start gap-3">
                    {isReorderMode && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-text-muted hover:text-primary transition-colors"
                        >
                            <GripVertical size={20} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-bold mb-2 text-text-main group-hover:text-gradient transition-all duration-300">{cls.name}</h3>
                        <p className="text-text-muted text-sm flex items-center gap-2">
                            <Calendar size={14} className="text-primary" /> {cls.schedule}
                        </p>
                    </div>
                </div>
                {!isReorderMode && (
                    <div className="flex gap-2">
                        <button onClick={(e) => openEditModal(e, cls)} className="bg-white/5 backdrop-blur-sm p-2 rounded-xl hover:bg-primary/20 text-text-muted hover:text-primary transition-all duration-300 border border-white/5 hover:border-primary/30">
                            <Pencil size={18} />
                        </button>
                        <button onClick={(e) => openDeleteModal(e, cls)} className="bg-white/5 backdrop-blur-sm p-2 rounded-xl hover:bg-danger/20 text-text-muted hover:text-danger transition-all duration-300 border border-white/5 hover:border-danger/30">
                            <Trash size={18} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    if (isReorderMode) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`glass-card group transition-all duration-300 relative overflow-hidden ${isDragging ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:translate-y-[-5px]'}`}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <Link
            ref={setNodeRef}
            style={style}
            to={`/class/${cls.id}`}
            className="glass-card group hover:translate-y-[-5px] transition-all duration-300 block no-underline text-inherit relative overflow-hidden"
        >
            {cardContent}
        </Link>
    );
};

export const Classes = () => {
    const [classes, setClasses] = useState<ClassModel[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newClass, setNewClass] = useState({ name: '', schedule: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isReorderMode, setIsReorderMode] = useState(false);

    // Edit/Delete State
    const [editingClass, setEditingClass] = useState<ClassModel | null>(null);
    const [editClassName, setEditClassName] = useState('');
    const [editClassSchedule, setEditClassSchedule] = useState('');
    const [deletingClass, setDeletingClass] = useState<ClassModel | null>(null);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchClasses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/classes/');
            setClasses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/classes/', newClass);
            setShowModal(false);
            setNewClass({ name: '', schedule: '' });
            fetchClasses();
        } catch (error) {
            alert('Error creating class');
        }
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClass) return;
        try {
            await api.put(`/classes/${editingClass.id}`, { name: editClassName, schedule: editClassSchedule });
            setEditingClass(null);
            fetchClasses();
        } catch (error) {
            alert('Erro ao atualizar turma');
        }
    };

    const handleDeleteClass = async () => {
        if (!deletingClass) return;
        try {
            await api.delete(`/classes/${deletingClass.id}`);
            setDeletingClass(null);
            fetchClasses();
        } catch (error) {
            alert('Erro ao excluir turma');
        }
    };

    const openEditModal = (e: React.MouseEvent, cls: ClassModel) => {
        e.preventDefault(); // Prevent Link navigation
        setEditingClass(cls);
        setEditClassName(cls.name);
        setEditClassSchedule(cls.schedule);
    };

    const openDeleteModal = (e: React.MouseEvent, cls: ClassModel) => {
        e.preventDefault(); // Prevent Link navigation
        setDeletingClass(cls);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = classes.findIndex((cls) => cls.id === active.id);
            const newIndex = classes.findIndex((cls) => cls.id === over.id);
            
            const newOrder = arrayMove(classes, oldIndex, newIndex);
            setClasses(newOrder);
            
            // Save the new order to the backend
            try {
                const orderData = newOrder.map((cls, index) => ({
                    id: cls.id,
                    display_order: index
                }));
                await api.put('/classes/reorder', orderData);
            } catch (error) {
                console.error('Error saving order:', error);
                // Revert on error
                fetchClasses();
            }
        }
    };

    return (
        <div>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Minhas Turmas
                </h2>
                {classes.length > 1 && (
                    <button
                        onClick={() => setIsReorderMode(!isReorderMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                            isReorderMode
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                    >
                        <ArrowUpDown size={18} />
                        {isReorderMode ? 'Concluir' : 'Reorganizar'}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="h-[50vh] flex items-center justify-center">
                    <Loading text="Carregando turmas..." />
                </div>
            ) : (
                <div className="animate-slide-up space-y-8">
                    {isReorderMode && (
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                            <p className="text-primary text-sm">
                                <GripVertical size={16} className="inline-block mr-2 -mt-0.5" />
                                Arraste os cards para reorganizar suas turmas
                            </p>
                        </div>
                    )}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={classes.map(c => c.id)} strategy={rectSortingStrategy}>
                            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {classes.map((cls, index) => (
                                    <SortableClassCard
                                        key={cls.id}
                                        cls={cls}
                                        index={index}
                                        isReorderMode={isReorderMode}
                                        openEditModal={openEditModal}
                                        openDeleteModal={openDeleteModal}
                                    />
                                ))}

                                {/* Add Class Card Button - only show when not in reorder mode */}
                                {!isReorderMode && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="glass-card flex flex-col items-center justify-center gap-4 group hover:bg-white/10 transition-all border-dashed border-2 border-white/10 hover:border-primary/50 cursor-pointer min-h-[150px]"
                                    >
                                        <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 border border-primary/20">
                                            <Plus size={32} className="text-primary" />
                                        </div>
                                        <span className="font-medium text-text-muted group-hover:text-white transition-colors">Criar Nova Turma</span>
                                    </button>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {classes.length === 0 && !isLoading && (
                <div className="text-center mt-12 animate-fade-in">
                    <p className="text-text-muted text-lg">Comece criando sua primeira turma acima.</p>
                </div>
            )}

            {/* Modern Modal */}
            {showModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-md p-8 animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                        <h3 className="text-2xl mb-6 font-bold text-white">Nova Turma</h3>
                        <form onSubmit={handleCreateClass} className="flex flex-col gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome da Turma</label>
                                <input className="glass-input" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required placeholder="Ex: Matemática Avançada" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Horário</label>
                                <input className="glass-input" value={newClass.schedule} onChange={e => setNewClass({ ...newClass, schedule: e.target.value })} required placeholder="Ex: Segundas e Quartas, 19h" />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="glass-button px-6 py-2 text-white rounded-xl font-medium">Criar Turma</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Class Modal */}
            {editingClass && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-md p-8 animate-slide-up relative overflow-hidden">
                        <button onClick={() => setEditingClass(null)} className="absolute top-4 right-4 text-text-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl mb-6 font-bold text-white flex items-center gap-2">
                            <Pencil size={24} className="text-primary" /> Editar Turma
                        </h3>
                        <form onSubmit={handleUpdateClass} className="flex flex-col gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Nome da Turma</label>
                                <input className="glass-input" value={editClassName} onChange={e => setEditClassName(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">Horário</label>
                                <input className="glass-input" value={editClassSchedule} onChange={e => setEditClassSchedule(e.target.value)} required />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setEditingClass(null)} className="px-4 py-2 text-text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="glass-button px-6 py-2 text-white rounded-xl font-medium">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Class Modal */}
            {deletingClass && (
                <div className="modal-overlay animate-fade-in">
                    <div className="glass-modal w-full max-w-sm p-6 relative animate-slide-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger/0 via-danger to-danger/0"></div>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-14 h-14 rounded-2xl bg-danger/20 flex items-center justify-center mb-4 text-danger border border-danger/30">
                                <AlertTriangle size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Excluir Turma?</h3>
                            <p className="text-text-muted mb-6">
                                Tem certeza que deseja excluir <strong className="text-white">{deletingClass.name}</strong>? Esta ação removerá todos os alunos e chamadas associados.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeletingClass(null)} className="flex-1 py-2 text-text-muted hover:bg-white/10 transition-all rounded-xl">Cancelar</button>
                                <button onClick={handleDeleteClass} className="flex-1 py-2 bg-danger/90 hover:bg-danger text-white rounded-xl shadow-lg shadow-danger/30 transition-all font-medium">Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
