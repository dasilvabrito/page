import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save, Trash2 } from 'lucide-react';

export function NewClientModal({ isOpen, onClose, onClientCreated, clientToEdit }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        nationality: '',
        marital_status: '',
        profession: '',
        rg: '',
        cpf: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                name: clientToEdit.name || '',
                nationality: clientToEdit.nationality || '',
                marital_status: clientToEdit.marital_status || '',
                profession: clientToEdit.profession || '',
                rg: clientToEdit.rg || '',
                cpf: clientToEdit.cpf || '',
                street: clientToEdit.street || '',
                number: clientToEdit.number || '',
                neighborhood: clientToEdit.neighborhood || '',
                city: clientToEdit.city || '',
                state: clientToEdit.state || '',
                zip: clientToEdit.zip || '',
                phone: clientToEdit.phone || '',
                email: clientToEdit.email || ''
            });
        } else {
            setFormData({
                name: '', nationality: '', marital_status: '', profession: '',
                rg: '', cpf: '', street: '', number: '', neighborhood: '',
                city: '', state: '', zip: '', phone: '', email: ''
            });
        }
    }, [clientToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (clientToEdit) {
                response = await axios.put(`/api/clients/${clientToEdit.id}`, formData);
            } else {
                response = await axios.post('/api/clients', formData);
            }
            onClientCreated(response.data.data, !!clientToEdit);
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Falha ao salvar cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

        setLoading(true);
        try {
            await axios.delete(`/api/clients/${clientToEdit.id}`);
            onClientCreated(clientToEdit, false, true); // (data, isEdit, isDelete)
            onClose();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Falha ao excluir cliente');
        } finally {
            setLoading(false);
        }
    }

    const formatCPF = (value) => {
        return value
            .replace(/\D/g, '') // Remove non-digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1'); // Limit size
    };

    const formatPhone = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const formatCEP = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    };

    const fetchAddress = async (cep) => {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (!res.data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: res.data.logradouro || '',
                    neighborhood: res.data.bairro || '',
                    city: res.data.localidade || '',
                    state: res.data.uf || '',
                    // Keep other fields
                }));
            }
        } catch (error) {
            console.error("Erro busca CEP", error);
        }
    };

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'cpf') {
            value = formatCPF(value);
        } else if (name === 'phone') {
            value = formatPhone(value);
        } else if (name === 'zip') {
            value = formatCEP(value);
            if (value.length === 9) {
                fetchAddress(value);
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-2xl rounded-lg shadow-lg border border-border p-6 relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <span className="bg-primary/10 p-1.5 rounded-md text-primary"><Save size={18} /></span>
                    {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Nome Completo</label>
                            <input
                                required
                                name="name"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Nome do Cliente"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nacionalidade</label>
                            <input
                                name="nationality"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Brasileiro(a)"
                                value={formData.nationality}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Estado Civil</label>
                            <select
                                name="marital_status"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                value={formData.marital_status}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                <option value="Solteiro">Solteiro</option>
                                <option value="Solteira">Solteira</option>
                                <option value="Casado">Casado</option>
                                <option value="Casada">Casada</option>
                                <option value="Divorciado">Divorciado</option>
                                <option value="Divorciada">Divorciada</option>
                                <option value="Viúvo">Viúvo</option>
                                <option value="Viúva">Viúva</option>
                                <option value="Separado Judicialmente">Separado Judicialmente</option>
                                <option value="Separada Judicialmente">Separada Judicialmente</option>
                                <option value="União Estável">União Estável</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Profissão</label>
                            <input
                                name="profession"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Advogado, Engenheiro..."
                                value={formData.profession}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium mb-1">RG</label>
                                <input
                                    name="rg"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Somente números"
                                    value={formData.rg}
                                    onChange={handleChange}
                                    maxLength={14}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">CPF</label>
                                <input
                                    name="cpf"
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    maxLength={14}
                                />
                            </div>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">CEP</label>
                            <input
                                name="zip"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="00000-000"
                                value={formData.zip || ''}
                                onChange={handleChange}
                                maxLength={9}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Cidade</label>
                            <input
                                name="city"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Cidade"
                                value={formData.city || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Estado (UF)</label>
                            <input
                                name="state"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="PA"
                                value={formData.state || ''}
                                onChange={handleChange}
                                maxLength={2}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Logradouro (Rua, Av, etc)</label>
                            <input
                                name="street"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Rua das Flores"
                                value={formData.street || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Número</label>
                            <input
                                name="number"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="123"
                                value={formData.number || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Bairro</label>
                            <input
                                name="neighborhood"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Centro"
                                value={formData.neighborhood || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Telefone / WhatsApp</label>
                            <input
                                name="phone"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="(99) 99999-9999"
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={15}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium mb-1">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="cliente@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border mt-6">
                        {clientToEdit ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 rounded-md hover:bg-destructive/10 text-destructive font-medium flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Excluir
                            </button>
                        ) : <div></div>}

                        <div className="flex">
                            <button
                                type="button"
                                onClick={onClose}
                                className="mr-2 px-4 py-2 rounded-md hover:bg-muted text-muted-foreground font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary text-primary-foreground h-10 px-6 py-2 rounded-md hover:bg-primary/90 flex items-center font-medium disabled:opacity-50 shadow-sm"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Salvar Cliente
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
