import { useState } from "react";
import { WeeklyPlanTask, Subtask, Course } from "../types";

interface PlanTaskCardProps {
    task: WeeklyPlanTask;
    courses: Course[];
    isAdmin: boolean;
    getCourseColor: (course: Course) => string;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<WeeklyPlanTask>) => void;
    isDeadlineMode?: boolean;
}

export default function PlanTaskCard({
    task,
    courses,
    isAdmin,
    getCourseColor,
    onToggle,
    onDelete,
    onUpdate,
    isDeadlineMode = false
}: PlanTaskCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [newSubtask, setNewSubtask] = useState("");
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descInput, setDescInput] = useState(task.description || "");

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        const st: Subtask = {
            id: crypto.randomUUID(),
            text: newSubtask.trim(),
            done: false
        };
        onUpdate(task.id, { subtasks: [...(task.subtasks || []), st] });
        setNewSubtask("");
    };

    const handleToggleSubtask = (stId: string) => {
        const updated = (task.subtasks || []).map(st => 
            st.id === stId ? { ...st, done: !st.done } : st
        );
        onUpdate(task.id, { subtasks: updated });
    };

    const handleDeleteSubtask = (stId: string) => {
        const updated = (task.subtasks || []).filter(st => st.id !== stId);
        onUpdate(task.id, { subtasks: updated });
    };

    const handleSaveDesc = () => {
        onUpdate(task.id, { description: descInput.trim() });
        setIsEditingDesc(false);
    };

    // Calculate progress
    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;
    const doneSubtasks = subtasks.filter(st => st.done).length;
    const progressPercent = hasSubtasks ? Math.round((doneSubtasks / subtasks.length) * 100) : (task.done ? 100 : 0);

    return (
        <div className={`p-4 rounded-2xl border transition-all group ${task.done ? 'bg-white/[0.01] border-white/5 opacity-60 hover:opacity-80' : (isDeadlineMode ? 'bg-cyan-900/10 border-cyan-500/20 hover:bg-cyan-900/20 hover:border-cyan-500/40' : 'bg-white/[0.03] border-white/8 hover:bg-white/[0.05]')}`}>
            
            {/* Header row */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => isAdmin && onToggle(task.id)}
                    disabled={!isAdmin}
                    className={`mt-1 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isAdmin ? (task.done ? 'border-emerald-600 bg-emerald-600 cursor-pointer' : 'border-zinc-600 hover:border-blue-400 cursor-pointer') : (task.done ? 'border-emerald-800 bg-emerald-900 cursor-default' : 'border-zinc-700 cursor-default')}`}
                >
                    {task.done && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                            {task.text}
                        </p>
                        {task.deadline && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.done ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                Due: {task.deadline}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {task.courseIds?.map(cid => {
                            const c = courses.find(c => c.id === cid);
                            if (!c) return null;
                            return (
                                <span key={cid} className={`text-[9px] font-black uppercase tracking-wider ${task.done ? 'text-zinc-600' : ''}`} style={!task.done ? { color: getCourseColor(c) } : {}}>
                                    {c.name}
                                </span>
                            );
                        })}
                    </div>

                    {/* Mini Progress bar if subtasks exist */}
                    {hasSubtasks && !expanded && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold">{doneSubtasks}/{subtasks.length}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 items-center">
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-white transition-colors p-1">
                        <svg className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded section */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-white/5 pl-10">
                    
                    {/* Description */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</h4>
                            {isAdmin && !isEditingDesc && (
                                <button onClick={() => setIsEditingDesc(true)} className="text-[10px] text-blue-400 hover:text-blue-300">Edit</button>
                            )}
                        </div>
                        
                        {isEditingDesc ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={descInput}
                                    onChange={e => setDescInput(e.target.value)}
                                    placeholder="Add context, links, or notes..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-300 focus:border-blue-500 outline-none min-h-[80px]"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1 text-xs text-zinc-500 hover:text-white">Cancel</button>
                                    <button onClick={handleSaveDesc} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold">Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                {task.description || <span className="italic opacity-50">No description provided.</span>}
                            </p>
                        )}
                    </div>

                    {/* Subtasks */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subtasks</h4>
                            {hasSubtasks && (
                                <span className="text-[10px] font-bold text-zinc-500">{progressPercent}%</span>
                            )}
                        </div>

                        {hasSubtasks && (
                            <div className="mb-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} style={{ width: `${progressPercent}%` }} />
                            </div>
                        )}

                        <div className="space-y-2 mb-4">
                            {subtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-3 group/st">
                                    <button
                                        onClick={() => isAdmin && handleToggleSubtask(st.id)}
                                        disabled={!isAdmin}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${st.done ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600 hover:border-zinc-400 bg-zinc-900'}`}
                                    >
                                        {st.done && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <span className={`text-sm flex-1 ${st.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                        {st.text}
                                    </span>
                                    {isAdmin && (
                                        <button onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover/st:opacity-100 text-zinc-600 hover:text-red-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isAdmin && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubtask}
                                    onChange={e => setNewSubtask(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                                    placeholder="Add a subtask..."
                                    className="flex-1 bg-transparent border-b border-zinc-700 focus:border-blue-500 text-sm text-white px-1 py-1 focus:outline-none placeholder-zinc-700"
                                />
                                <button
                                    onClick={handleAddSubtask}
                                    disabled={!newSubtask.trim()}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-400"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
