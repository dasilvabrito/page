import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Trash2, Save, UserPlus, RotateCcw, MessageSquare, Clock, Upload, Folder, AlertTriangle, Scale } from 'lucide-react';

export function EditDealModal({ isOpen, onClose, deal, currentUser, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [comments, setComments] = useState([]);
    const [files, setFiles] = useState([]);

    // Form Editor State
    const [formData, setFormData] = useState({ ...deal });
    const [justification, setJustification] = useState('');
    const [needsJustification, setNeedsJustification] = useState(false);

    // Delegation State
    const [delegatingTo, setDelegatingTo] = useState('');
    const [instructions, setInstructions] = useState('');

    // Return State
    const [returnReport, setReturnReport] = useState('');

    // File Upload Ref
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // PJE State
    const [loadingPje, setLoadingPje] = useState(false);
    const [pjeData, setPjeData] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({ ...deal });
            setJustification('');
            setNeedsJustification(false);
            fetchData();
        }
    }, [isOpen, deal]);

    useEffect(() => {
        // Check if deadline was extended
        if (formData.deadline && deal.deadline) {
            const oldDate = new Date(deal.deadline);
            const newDate = new Date(formData.deadline);
            // Simplify comparison (ignore time)
            const oldTime = oldDate.setHours(0, 0, 0, 0);
            const newTime = newDate.setHours(0, 0, 0, 0);

            if (newTime > oldTime) {
                setNeedsJustification(true);
            } else {
                setNeedsJustification(false);
            }
        }
    }, [formData.deadline, deal.deadline]);

    const fetchData = async () => {
        try {
            const [usersRes, commentsRes, filesRes] = await Promise.all([
                axios.get('/api/users'),
                axios.get(`/api/deals/${deal.id}/comments`),
                axios.get(`/api/deals/${deal.id}/files`)
            ]);
            setUsers(usersRes.data.data);
            setComments(commentsRes.data.data);
            setFiles(filesRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!confirm('Excluir esta tarefa permanentemente?')) return;
        try {
            await axios.delete(`/api/deals/${deal.id}`);
            onUpdate();
        } catch (error) {
            alert('Erro ao excluir tarefa: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSave = async () => {
        if (needsJustification && !justification.trim()) {
            alert("É obrigatório justificar a prorrogação do prazo.");
            return;
        }

        setLoading(true);
        try {
            await axios.put(`/api/deals/${deal.id}`, {
                ...formData,
                justification: needsJustification ? justification : null,
                user_id: currentUser.id
            });
            onUpdate();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message;
            alert('Erro ao salvar: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm(`Confirmar upload do arquivo "${file.name}" para a pasta do cliente?`)) {
            e.target.value = '';
            return;
        }

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('user_id', currentUser.id);

        try {
            await axios.post(`/api/deals/${deal.id}/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Upload realizado com sucesso!');
            fetchData(); // Refresh comments to see log
        } catch (error) {
            console.error(error);
            // Better error handling
            const msg = error.response?.data?.error || error.message || 'Erro desconhecido';
            alert('Erro no upload: ' + msg);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            let dateObj = new Date(dateStr);
            if (dateStr.length === 10) {
                dateObj = new Date(dateStr + 'T12:00:00');
            }
            if (isNaN(dateObj)) return dateStr;
            return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(dateObj);
        } catch (e) {
            return dateStr || '';
        }
    };

    const handleDelegate = async (e) => {
        e.preventDefault();
        if (!delegatingTo || !instructions) {
            alert("Selecione um usuário e preencha as instruções.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`/api/deals/${deal.id}/delegate`, {
                delegated_to_id: delegatingTo,
                instructions,
                user_id: currentUser.id
            });
            onUpdate();
            fetchData();
            setInstructions('');
            setDelegatingTo('');
            alert("Tarefa delegada com sucesso!");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || (typeof error.response?.data === 'string' ? 'Erro no Servidor (HTML)' : error.message);
            alert('Erro ao delegar: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        if (!returnReport) {
            alert("Informe o que foi feito.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`/api/deals/${deal.id}/return`, {
                report: returnReport,
                user_id: currentUser.id
            });
            onUpdate();
            fetchData();
            setReturnReport('');
            alert("Tarefa devolvida com sucesso!");
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            alert('Erro ao devolver: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePjeSync = async () => {
        if (!formData.process_number) return;
        setLoadingPje(true);
        try {
            const res = await axios.post(`/api/deals/${deal.id}/pje-sync`, {
                user_id: currentUser.id
            });

            if (res.data.data) {
                setPjeData(res.data.data);
                // Also refresh comments as it logs there
                const commentsRes = await axios.get(`/api/deals/${deal.id}/comments`);
                setComments(commentsRes.data.data);
            } else {
                alert("Nenhum processo encontrado ou erro na busca.");
            }
        } catch (error) {
            console.error("PJE Error:", error);
            alert("Erro ao consultar DataJud: " + (error.response?.data?.error || error.message));
        } finally {
            setLoadingPje(false);
        }
    };

    const isCollaborator = currentUser.role !== 'admin' && currentUser.role !== 'lawyer';
    const isBoss = currentUser.role === 'admin' || currentUser.role === 'lawyer';
    const isDelegated = !!deal.delegated_to_id;
    const isDelegatedToMe = deal.delegated_to_id === currentUser.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-4xl h-[90vh] flex flex-col rounded-lg shadow-lg border border-border relative animate-in zoom-in-95 duration-200">

                {/* Header Actions */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">Editar Tarefa</h2>
                    </div>
                    <div className="flex gap-2">
                        {isBoss && (
                            <button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                                <Save size={16} /> Salvar Alterações
                            </button>
                        )}
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content - Two Columns Layout for better space usage */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Left Column: Form & Details (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 md:border-r border-border">

                        {/* Title & Client */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Título</label>
                                <input
                                    className="w-full p-2 border rounded font-medium bg-background"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    disabled={!isBoss}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Cliente</label>
                                <input
                                    className="w-full p-2 border rounded bg-muted/50"
                                    value={formData.client_name}
                                    disabled
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Processo (CNJ)</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-2 border rounded font-mono text-sm bg-background"
                                        value={formData.process_number || ''}
                                        onChange={e => setFormData({ ...formData, process_number: e.target.value })}
                                        placeholder="0000000-00.0000.0.00.0000"
                                        disabled={!isBoss}
                                    />
                                    {formData.process_number && (
                                        <button
                                            onClick={handlePjeSync}
                                            disabled={loadingPje}
                                            className="bg-purple-600 text-purple-50 px-3 py-1 rounded text-xs font-medium hover:bg-purple-700 flex items-center justify-center min-w-[40px]"
                                            title="Consultar DataJud"
                                        >
                                            {loadingPje ? <Clock size={16} className="animate-spin" /> : <Scale size={16} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* PJE Results Panel */}
                            {pjeData && (
                                <div className="col-span-2 bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-purple-800 flex items-center gap-1">
                                            <Scale size={12} /> Movimentações (DataJud)
                                        </h4>
                                        <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                                            {pjeData.movimentos?.length || 0} encontrados
                                        </span>
                                    </div>
                                    <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                        {pjeData.movimentos?.slice(0, 20).map((mov, idx) => (
                                            <div key={idx} className="bg-white p-2 rounded border border-purple-100 text-xs shadow-sm">
                                                <div className="font-semibold text-purple-900">{mov.nome}</div>
                                                <div className="text-[10px] text-muted-foreground flex justify-between mt-1">
                                                    <span>{formatDate(mov.dataHuora || mov.dataHora)}</span>
                                                    {mov.complementosTabelados?.length > 0 && (
                                                        <span>{mov.complementosTabelados[0].descricao}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Priority, Deadline, Responsible */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/10 p-4 rounded-lg border">
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Prioridade</label>
                                <select
                                    className="w-full p-2 border rounded bg-background"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    disabled={!isBoss}
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Média">Média</option>
                                    <option value="Alta">Alta</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Data Fatal</label>
                                <input
                                    type="date"
                                    className={`w-full p-2 border rounded bg-background ${needsJustification ? 'border-amber-500 ring-1 ring-amber-500' : ''}`}
                                    value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    disabled={!isBoss}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Responsável</label>
                                <select
                                    className="w-full p-2 border rounded bg-background"
                                    value={formData.responsible_id || ''}
                                    onChange={e => setFormData({ ...formData, responsible_id: e.target.value })}
                                    disabled={!isBoss}
                                >
                                    <option value="">Selecione...</option>
                                    {users && users.filter(u => u.role !== 'collaborator').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Justification Alert */}
                        {needsJustification && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                                    <AlertTriangle size={18} /> Justificativa Necessária
                                </div>
                                <p className="text-sm text-amber-700 mb-2">Você postergou a data fatal. É obrigatório justificar.</p>
                                <textarea
                                    className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 text-sm"
                                    placeholder="Digite o motivo da alteração de prazo..."
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Folder Path & Upload */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                    <Folder size={14} /> Pasta do Cliente (Servidor)
                                </label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        className="flex-1 p-2 border rounded font-mono text-xs bg-muted/30"
                                        value={formData.folder_path || ''}
                                        onChange={e => setFormData({ ...formData, folder_path: e.target.value })}
                                        placeholder="Caminho não definido"
                                    />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        onClick={handleUploadClick}
                                        disabled={uploading || !formData.folder_path}
                                        className="bg-secondary text-secondary-foreground px-3 py-2 rounded text-xs font-medium hover:bg-secondary/80 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {uploading ? <Clock size={14} className="animate-spin" /> : <Upload size={14} />}
                                        Upload
                                    </button>
                                </div>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="border rounded-md bg-muted/10 p-2">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">Arquivos da Tarefa</h4>
                                    <div className="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                        {(files || []).map(f => (
                                            <div key={f.id} className="flex items-center justify-between text-xs bg-background p-1.5 rounded border border-border/50">
                                                <span className="truncate flex-1 font-medium" title={f.file_name}>{f.file_name}</span>
                                                <span className="text-[10px] text-muted-foreground ml-2">{formatDate(f.uploaded_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Descrição / Instruções</label>
                            <textarea
                                className="w-full min-h-[100px] p-3 border rounded bg-background mt-1"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                disabled={!isBoss}
                            />
                        </div>


                        {/* ACTIONS (Delegation/Return/Delete) */}
                        <div className="border-t pt-6">
                            <h3 className="font-medium mb-4">Ações Operacionais</h3>

                            {/* Boss: Delegate */}
                            {isBoss && !isDelegated && (
                                <form onSubmit={handleDelegate} className="bg-card border rounded-md p-4 space-y-4">
                                    <h4 className="flex items-center gap-2 font-medium text-sm">
                                        <UserPlus size={16} /> Delegar Tarefa
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-xs font-medium">Delegar para:</label>
                                            <select
                                                className="w-full h-9 px-2 rounded border text-sm"
                                                value={delegatingTo}
                                                onChange={e => setDelegatingTo(e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                {users && users.filter(u => u.role !== 'admin').map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium">Instruções de Delegação:</label>
                                        <textarea
                                            className="w-full min-h-[60px] p-2 rounded border text-sm mt-1"
                                            placeholder="Detalhes..."
                                            value={instructions}
                                            onChange={e => setInstructions(e.target.value)}
                                        />
                                    </div>
                                    <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
                                        Confirmar Delegação
                                    </button>
                                </form>
                            )}

                            {/* Collaborator: Return */}
                            {isDelegatedToMe && (
                                <form onSubmit={handleReturn} className="bg-green-50 border border-green-200 rounded-md p-4 space-y-4">
                                    <h4 className="flex items-center gap-2 font-medium text-sm text-green-800">
                                        <RotateCcw size={16} /> Concluir / Devolver
                                    </h4>
                                    <div>
                                        <label className="text-xs font-medium text-green-800">Relatório:</label>
                                        <textarea
                                            className="w-full min-h-[80px] p-2 rounded border border-green-200 text-sm mt-1 focus:ring-green-500"
                                            placeholder="O que foi feito..."
                                            value={returnReport}
                                            onChange={e => setReturnReport(e.target.value)}
                                        />
                                    </div>
                                    <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700">
                                        Devolver Tarefa
                                    </button>
                                </form>
                            )}

                            {/* Delete Button */}
                            {isBoss && (
                                <div className="mt-8 flex justify-end">
                                    <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded text-sm flex items-center gap-2 border border-transparent hover:border-red-200 transition-all">
                                        <Trash2 size={16} /> Excluir Tarefa
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Comments (History) */}
                    <div className="w-full md:w-[320px] bg-muted/10 border-t md:border-t-0 md:border-l border-border flex flex-col h-[400px] md:h-auto">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="font-medium flex items-center gap-2 text-sm">
                                <MessageSquare size={16} /> Histórico / Comentários
                                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{(comments || []).length}</span>
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {(!comments || comments.length === 0) ? (
                                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum histórico.</p>
                            ) : (
                                (comments || []).map(c => (
                                    <div key={c.id} className={`flex gap-3 ${c.type === 'instruction' ? 'bg-blue-50/50' : c.type === 'return' ? 'bg-green-50/50' : 'bg-background'} p-3 rounded-lg border border-border/50 shadow-sm text-sm`}>
                                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold uppercase border border-primary/20">
                                            {c.user_name?.substring(0, 2)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">{c.user_name}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    {formatDate(c.created_at)}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-medium uppercase text-muted-foreground">
                                                {c.type === 'instruction' ? 'Delegação' : c.type === 'return' ? 'Retorno' : 'Info'}
                                            </div>
                                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
