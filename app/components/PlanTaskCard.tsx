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

    // Inline editing states
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(task.text);
    const [editingDesc, setEditingDesc] = useState(false);
    const [descInput, setDescInput] = useState(task.description || "");
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [subtaskEditInput, setSubtaskEditInput] = useState("");

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        const st: Subtask = { id: crypto.randomUUID(), text: newSubtask.trim(), done: false };
        onUpdate(task.id, { subtasks: [...(task.subtasks || []), st] });
        setNewSubtask("");
    };

    const handleToggleSubtask = (stId: string) => {
        if (editingSubtaskId === stId) return; // don't toggle when editing
        const updated = (task.subtasks || []).map(st =>
            st.id === stId ? { ...st, done: !st.done } : st
        );
        onUpdate(task.id, { subtasks: updated });
    };

    const handleDeleteSubtask = (stId: string) => {
        const updated = (task.subtasks || []).filter(st => st.id !== stId);
        onUpdate(task.id, { subtasks: updated });
    };

    const handleSaveSubtaskEdit = (stId: string) => {
        if (!subtaskEditInput.trim()) { setEditingSubtaskId(null); return; }
        const updated = (task.subtasks || []).map(st =>
            st.id === stId ? { ...st, text: subtaskEditInput.trim() } : st
        );
        onUpdate(task.id, { subtasks: updated });
        setEditingSubtaskId(null);
    };

    const handleSaveName = () => {
        if (nameInput.trim()) onUpdate(task.id, { text: nameInput.trim() });
        setEditingName(false);
    };

    const handleSaveDesc = () => {
        onUpdate(task.id, { description: descInput.trim() });
        setEditingDesc(false);
    };

    const subtasks = task.subtasks || [];
    const hasSubtasks = subtasks.length > 0;
    const doneSubtasks = subtasks.filter(st => st.done).length;
    const progressPercent = hasSubtasks
        ? Math.round((doneSubtasks / subtasks.length) * 100)
        : task.done ? 100 : 0;

    // Deadline formatting  
    const deadlineDisplay = task.deadline
        ? new Date(task.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null;

    const daysUntilDeadline = task.deadline
        ? Math.ceil((new Date(task.deadline + "T00:00:00").getTime() - new Date().setHours(0,0,0,0)) / 86400000)
        : null;

    const deadlineUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && !task.done;

    return (
        <div className={`rounded-2xl border transition-all duration-200 group backdrop-blur-xl ${
            task.done
                ? "bg-white/[0.03] border-white/10 ring-1 ring-white/5 opacity-50 hover:opacity-70"
                : isDeadlineMode
                    ? "bg-white/[0.03] border-white/10 ring-1 ring-cyan-500/10 hover:bg-white/[0.05]"
                    : "bg-white/[0.03] border-white/10 ring-1 ring-white/5 hover:bg-white/[0.05]"
        }`}>

            {/* Card header */}
            <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <button
                    onClick={() => isAdmin && onToggle(task.id)}
                    disabled={!isAdmin}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isAdmin
                            ? task.done
                                ? "border-emerald-600 bg-emerald-600 cursor-pointer"
                                : "border-zinc-600 hover:border-blue-400 cursor-pointer"
                            : task.done
                                ? "border-emerald-800 bg-emerald-900 cursor-default"
                                : "border-zinc-700 cursor-default"
                    }`}
                >
                    {task.done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Title area */}
                <div className="flex-1 min-w-0">
                    {editingName ? (
                        <input
                            autoFocus
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    ) : (
                        <p
                            onClick={() => isAdmin && !task.done && setEditingName(true)}
                            className={`text-sm font-medium leading-snug ${
                                task.done ? "text-zinc-600 line-through" : "text-zinc-200"
                            } ${isAdmin && !task.done ? "cursor-text hover:text-white transition-colors" : ""}`}
                        >
                            {task.text}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {/* Course tags */}
                        {task.courseIds?.map(cid => {
                            const c = courses.find(c => c.id === cid);
                            if (!c) return null;
                            return (
                                <span
                                    key={cid}
                                    className="text-[9px] font-black uppercase tracking-wider"
                                    style={!task.done ? { color: getCourseColor(c) } : { color: "#52525b" }}
                                >{c.name}</span>
                            );
                        })}

                        {/* Deadline pill */}
                        {deadlineDisplay && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                task.done
                                    ? "bg-zinc-800 text-zinc-500"
                                    : deadlineUrgent
                                        ? "bg-red-500/20 text-red-400 animate-pulse"
                                        : "bg-cyan-500/15 text-cyan-400"
                            }`}>
                                {deadlineUrgent && !task.done ? `⚠ ` : ""}{deadlineDisplay}
                                {daysUntilDeadline !== null && !task.done && (
                                    <span className="opacity-60 ml-1">({daysUntilDeadline}d)</span>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Inline mini progress bar */}
                    {hasSubtasks && !expanded && (
                        <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${progressPercent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-600 to-cyan-400"}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold tabular-nums">{doneSubtasks}/{subtasks.length}</span>
                        </div>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1 rounded"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="text-zinc-500 hover:text-white transition-colors p-1 rounded"
                    >
                        <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded body */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-5 pl-12">

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</h4>
                            {isAdmin && !editingDesc && (
                                <button
                                    onClick={() => { setDescInput(task.description || ""); setEditingDesc(true); }}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                                >Edit</button>
                            )}
                        </div>

                        {editingDesc ? (
                            <div className="space-y-2">
                                <textarea
                                    autoFocus
                                    value={descInput}
                                    onChange={e => setDescInput(e.target.value)}
                                    placeholder="Add context, links, or notes..."
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-300 focus:border-blue-500 outline-none min-h-[72px] resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingDesc(false)} className="px-3 py-1 text-xs text-zinc-500 hover:text-white">Cancel</button>
                                    <button onClick={handleSaveDesc} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-bold">Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                {task.description || <span className="italic text-zinc-600">No description.</span>}
                            </p>
                        )}
                    </div>

                    {/* Subtasks */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subtasks</h4>
                            {hasSubtasks && <span className="text-[10px] font-bold text-zinc-500">{progressPercent}%</span>}
                        </div>

                        {hasSubtasks && (
                            <div className="mb-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${progressPercent === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-blue-600 to-cyan-400"}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        )}

                        <div className="space-y-2 mb-3">
                            {subtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-2.5 group/st">
                                    <button
                                        onClick={() => isAdmin && handleToggleSubtask(st.id)}
                                        disabled={!isAdmin || editingSubtaskId === st.id}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                            st.done ? "border-emerald-500 bg-emerald-500" : "border-zinc-600 hover:border-zinc-400 bg-transparent"
                                        }`}
                                    >
                                        {st.done && (
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {editingSubtaskId === st.id ? (
                                        <input
                                            autoFocus
                                            value={subtaskEditInput}
                                            onChange={e => setSubtaskEditInput(e.target.value)}
                                            onBlur={() => handleSaveSubtaskEdit(st.id)}
                                            onKeyDown={e => {
                                                if (e.key === "Enter") handleSaveSubtaskEdit(st.id);
                                                if (e.key === "Escape") setEditingSubtaskId(null);
                                            }}
                                            className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-2 py-0.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    ) : (
                                        <span
                                            onDoubleClick={() => { if (isAdmin) { setEditingSubtaskId(st.id); setSubtaskEditInput(st.text); } }}
                                            className={`text-sm flex-1 leading-snug select-none ${st.done ? "text-zinc-600 line-through" : "text-zinc-300"} ${isAdmin ? "cursor-text" : ""}`}
                                            title={isAdmin ? "Double-click to edit" : ""}
                                        >{st.text}</span>
                                    )}

                                    {isAdmin && editingSubtaskId !== st.id && (
                                        <button onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover/st:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
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
                                    onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                                    placeholder="Add a subtask..."
                                    className="flex-1 bg-transparent border-b border-zinc-700 focus:border-blue-500 text-sm text-white px-1 py-1 focus:outline-none placeholder-zinc-700 transition-colors"
                                />
                                <button
                                    onClick={handleAddSubtask}
                                    disabled={!newSubtask.trim()}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors"
                                >Add</button>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
