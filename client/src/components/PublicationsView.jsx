import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Plus, Calendar, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export function PublicationsView({ currentUser }) {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');

    // Sync Params
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Task Creation Modal
    const [selectedPub, setSelectedPub] = useState(null);
    const [taskData, setTaskData] = useState({ title: '', deadline: '', responsible_id: '' });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);

        setStartDate(lastWeek.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);

        fetchPublications();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data.data);
            if (currentUser && !taskData.responsible_id) {
                setTaskData(prev => ({ ...prev, responsible_id: currentUser.id }));
            }
        } catch (e) { console.error(e); }
    };

    const fetchPublications = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/publications', { params: { status: filterStatus } });
            setPublications(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!startDate || !endDate) return alert("Selecione o período.");
        setSyncing(true);
        try {
            const res = await axios.post('/api/publications/sync', { startDate, endDate });
            alert(`Sincronização concluída! ${res.data.count} publicações encontradas/atualizadas.`);
            fetchPublications();
        } catch (error) {
            console.error(error);
            alert("Erro na sincronização: " + (error.response?.data?.error || error.message));
        } finally {
            setSyncing(false);
        }
    };

    const openTaskModal = (pub) => {
        setSelectedPub(pub);
        setTaskData({
            title: `Análise de Publicação: ${pub.process_number || 'Sem Processo'}`,
            deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // +5 days default
            responsible_id: currentUser?.id || ''
        });
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!selectedPub) return;

        try {
            await axios.post(`/api/publications/${selectedPub.id}/create-task`, taskData);
            alert("Tarefa criada com sucesso!");
            setSelectedPub(null);
            fetchPublications(); // Refresh status
        } catch (error) {
            console.error(error);
            alert("Erro ao criar tarefa");
        }
    };

    const handleDeletePublication = async (id) => {
        if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;
        try {
            await axios.delete(`/api/publications/${id}`);
            fetchPublications();
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir publicação");
        }
    };

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full bg-background/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-primary" /> Publicações
                </h2>

                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">De:</label>
                        <input
                            type="date"
                            className="h-8 rounded border px-2 text-sm bg-background"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Até:</label>
                        <input
                            type="date"
                            className="h-8 rounded border px-2 text-sm bg-background"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-8 px-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    >
                        {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Sincronizar
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b bg-muted/20 flex gap-2">
                    <select
                        className="h-9 rounded border px-3 text-sm"
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); fetchPublications(); }}
                    >
                        <option value="">Todos os Status</option>
                        <option value="new">Novas</option>
                        <option value="processed">Processadas</option>
                    </select>
                </div>

                <div className="overflow-y-auto flex-1 p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>
                    ) : publications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground opacity-50">
                            <FileText size={48} className="mb-2" />
                            <p>Nenhuma publicação encontrada.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {publications.map(pub => (
                                <div key={pub.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-4">
                                    <div className="pt-1">
                                        {pub.status === 'new' ?
                                            <AlertCircle className="text-amber-500" size={20} /> :
                                            <CheckCircle className="text-green-500" size={20} />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-sm">{pub.court} - Processo: {pub.process_number || 'N/A'}</h3>
                                            <span className="text-xs text-muted-foreground">{new Date(pub.publication_date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-2 font-mono bg-muted/30 p-2 rounded">
                                            {pub.content}
                                        </p>

                                        {pub.status === 'new' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openTaskModal(pub)}
                                                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded hover:bg-secondary/80 font-medium flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Criar Tarefa
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePublication(pub.id)}
                                                    className="text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded hover:bg-destructive/20 font-medium flex items-center gap-1"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Modal */}
            {selectedPub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background w-full max-w-md rounded-lg shadow-lg border p-6">
                        <h3 className="text-lg font-bold mb-4">Criar Tarefa da Publicação</h3>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    className="w-full h-10 px-3 rounded border bg-background"
                                    value={taskData.title}
                                    onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Prazo Fatal</label>
                                <input
                                    type="date"
                                    className="w-full h-10 px-3 rounded border bg-background"
                                    value={taskData.deadline}
                                    onChange={e => setTaskData({ ...taskData, deadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Responsável</label>
                                <select
                                    className="w-full h-10 px-3 rounded border bg-background"
                                    value={taskData.responsible_id}
                                    onChange={e => setTaskData({ ...taskData, responsible_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setSelectedPub(null)} className="px-4 py-2 rounded hover:bg-muted">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Criar Tarefa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
