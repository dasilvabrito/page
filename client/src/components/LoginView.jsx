import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Key } from 'lucide-react';

export function LoginView({ onLogin }) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', { login, password });
            onLogin(res.data.data);
        } catch (err) {
            setError('Login ou senha inválidos.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-4 rounded-xl shadow-lg shadow-amber-500/20">
                            <Lock className="text-white" size={32} />
                        </div>
                    </div>
                    <div className="text-center mb-2">
                        <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">
                            Brito <span className="text-amber-600">&</span> Santos
                        </h2>
                        <span className="text-xs font-sans font-semibol tracking-[0.2em] uppercase text-slate-500">Advocacia</span>
                    </div>
                    <p className="text-center text-slate-400 mb-8 mt-2 text-sm">Faça login para acessar o sistema</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 border border-red-100 flex items-center gap-2 justify-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 h-10 rounded-md border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Seu login (ex: joao.silva)"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    className="w-full pl-10 h-10 rounded-md border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full h-10 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-2"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-400">
                    &copy; 2026 LawFirm OS. Todos os direitos reservados.
                </div>
            </div>
        </div>
    );
}
