import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, User } from 'lucide-react';

export function LawyerSelectionModal({ isOpen, onClose, onConfirm }) {
    const [users, setUsers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSelectedIds([]);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            // Filter only lawyers and admins
            const lawyers = res.data.data.filter(u => u.role === 'lawyer' || u.role === 'admin');
            setUsers(lawyers);

            // Auto-select current user if they are in the list
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser && lawyers.find(u => u.id === currentUser.id)) {
                setSelectedIds([currentUser.id]);
            }
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        const selectedUsers = users.filter(u => selectedIds.includes(u.id));
        onConfirm(selectedUsers);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-lg">Selecionar Advogados</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                        Selecione os advogados que constarão na procuração:
                    </p>
                    <div className="space-y-2">
                        {users.map(user => (
                            <label key={user.id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${selectedIds.includes(user.id) ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-card border-input hover:bg-muted/50'}`}>
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={selectedIds.includes(user.id)}
                                    onChange={() => toggleSelection(user.id)}
                                />
                                <div>
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        {user.name}
                                        {user.role === 'admin' && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded">Admin</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        OAB: {user.oab || 'N/A'} {user.oab_uf}
                                    </div>
                                    {user.office_address ? (
                                        <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[250px]">
                                            {user.office_address}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> Endereço não cadastrado
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}

                        {users.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum advogado cadastrado.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md bg-background border border-input">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check size={16} />
                        Gerar Procuração ({selectedIds.length})
                    </button>
                </div>
            </div>
        </div>
    );
}

function AlertCircle({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    );
}
