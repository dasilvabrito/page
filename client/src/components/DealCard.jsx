import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, User, Pencil, Scale } from 'lucide-react';

export function DealCard({ deal, onClick }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: deal.id, data: { ...deal } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Alta': return 'bg-red-100 text-red-800 border-red-200';
            case 'Média': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Correct for timezone offset if needed, but simple UTC display is usually safer or local
        // Assuming stored as YYYY-MM-DD
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(dateStr + 'T12:00:00'));
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-card text-card-foreground p-3 rounded-lg shadow-sm border border-border mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative border-l-4"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-sm leading-tight">{deal.title}</h4>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">{deal.client_name}</span>
                </div>
                <div className="flex gap-1">
                    <button
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent drag start
                            if (onClick) onClick();
                        }}
                        title="Editar / Detalhes"
                    >
                        <Pencil size={14} />
                    </button>
                    {/* Drag Handle if needed, but whole card is draggable via listeners spread on div */}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 items-center">
                {/* Priority Badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(deal.priority)}`}>
                    {deal.priority || 'Normal'}
                </span>

                {/* Deadline */}
                {deal.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        <Clock size={10} />
                        {formatDate(deal.deadline)}
                    </div>
                )}
            </div>

            {/* Footer: Responsible & Delegation */}
            <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                {/* Delegation Flag */}
                {deal.delegated_to_name ? (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                        <User size={10} />
                        <span>Delegado: {deal.delegated_to_name.split(' ')[0]}</span>
                    </div>
                ) : <div></div>}

                {/* Responsible */}
                {deal.responsible_name && (
                    <div className="flex items-center gap-1 text-muted-foreground" title="Responsável">
                        <User size={10} />
                        <span>{deal.responsible_name.split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
