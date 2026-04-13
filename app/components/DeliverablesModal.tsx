"use client";

import { useState } from "react";
import { Course, Deliverable } from "../types";
import { getDaysUntil } from "../hooks/useCourses";

interface DeliverablesModalProps {
    course: Course;
    onToggle: (id: string) => void;
    onAdd: (name: string, dueDate?: string, category?: "implementation" | "scientific") => void;
    onDelete: (id: string) => void;
    onClose: () => void;
    isAdmin?: boolean;
}

export default function DeliverablesModal({
    course,
    onToggle,
    onAdd,
    onDelete,
    onClose,
    isAdmin = false,
}: DeliverablesModalProps) {
    const [newTask, setNewTask] = useState("");
    const [newDueDate, setNewDueDate] = useState("");
    const [newCategory, setNewCategory] = useState<"implementation" | "scientific">("implementation");

    const isProject = course.itemType === "project";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim() || !isAdmin) return;
        onAdd(newTask.trim(), newDueDate || undefined, isProject ? newCategory : undefined);
        setNewTask("");
        setNewDueDate("");
    };

    // Sort: incomplete first, then completed
    const sorted: Deliverable[] = [
        ...(course.deliverables?.filter((d) => !d.completed) ?? []),
        ...(course.deliverables?.filter((d) => d.completed) ?? []),
    ];

    // For projects, split by category
    const implTasks = course.deliverables?.filter((d) => d.category === "implementation" || (!d.category && isProject)) ?? [];
    const sciTasks = course.deliverables?.filter((d) => d.category === "scientific") ?? [];

    const completedCount = course.deliverables?.filter((d) => d.completed).length ?? 0;
    const totalCount = course.deliverables?.length ?? 0;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 rounded-3xl p-4 sm:p-6 w-full max-w-md border border-zinc-800 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {isProject ? "Project Tasks" : "Assignments & Sheets"}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-0.5">{course.name}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Course Description */}
                {course.description && (
                    <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1.5">Exam Notes / Info</p>
                        <p className="text-zinc-300 text-sm leading-relaxed italic">
                            "{course.description}"
                        </p>
                    </div>
                )}

                {/* Link buttons */}
                {(course.notebookLMLink || course.notionLink) && (
                    <div className={`mb-6 grid gap-2 ${course.notebookLMLink && course.notionLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {/* NotebookLM Link */}
                        {course.notebookLMLink && (
                            <a
                                href={course.notebookLMLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#1a1625] to-[#1e1a2e] border border-purple-500/20 hover:border-purple-400/40 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform p-[1px] flex-shrink-0">
                                    <div className="w-full h-full rounded-[6px] bg-[#1a1625] flex items-center justify-center">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z" fill="url(#sparkle)" />
                                            <defs>
                                                <linearGradient id="sparkle" x1="4" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#EC4899" />
                                                    <stop offset="0.5" stopColor="#A855F7" />
                                                    <stop offset="1" stopColor="#3B82F6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-xs">NotebookLM</p>
                                    <p className="text-zinc-500 text-[10px] truncate">AI study chat</p>
                                </div>
                            </a>
                        )}

                        {/* Notion Link */}
                        {course.notionLink && (
                            <a
                                href={course.notionLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                                    <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                                        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-xs">Notion</p>
                                    <p className="text-zinc-500 text-[10px] truncate">Notes & docs</p>
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* Progress strip */}
                {totalCount > 0 && (
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                            <span>{completedCount} of {totalCount} done</span>
                            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Tasks list */}
                <div className="space-y-2 max-h-[45vh] overflow-y-auto mb-5 pr-1">
                    {totalCount === 0 && (
                        <div className="text-center py-10 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                            <p className="text-sm">{isProject ? "No tasks added yet" : "No assignments added yet"}</p>
                            {isAdmin && <p className="text-xs mt-1 text-zinc-700">Add one below</p>}
                        </div>
                    )}

                    {isProject ? (
                        <>
                            {/* Implementation Tasks */}
                            {(implTasks.length > 0 || (sciTasks.length === 0 && totalCount > 0)) && (
                                <div className="mb-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-2 px-1 flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Implementation
                                    </p>
                                    <div className="space-y-2">
                                        {implTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} isAdmin={isAdmin} />)}
                                    </div>
                                </div>
                            )}
                            {/* Scientific Deliverables */}
                            {sciTasks.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2 px-1">🔬 Scientific Deliverables</p>
                                    <div className="space-y-2">
                                        {sciTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} isAdmin={isAdmin} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        sorted.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} isAdmin={isAdmin} />)
                    )}
                </div>

                {/* Add form - admin only */}
                {isAdmin && (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        {isProject && (
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setNewCategory("implementation")}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${newCategory === "implementation" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Implementation
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewCategory("scientific")}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newCategory === "scientific" ? "bg-violet-700 text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    🔬 Scientific
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder={isProject ? "Add a task..." : "Assignment / problem set name..."}
                                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newTask.trim()}
                                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        {!isProject && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="text-xs text-zinc-500 whitespace-nowrap">Due date (optional):</label>
                                <input
                                    type="date"
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}

// ─── Shared task row ─────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete, isAdmin }: {
    task: Deliverable;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    isAdmin?: boolean;
}) {
    const dueDays = task.dueDate ? getDaysUntil(task.dueDate) : null;
    const isOverdue = dueDays !== null && dueDays < 0 && !task.completed;
    const isDueSoon = dueDays !== null && dueDays >= 0 && dueDays <= 3 && !task.completed;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl group transition-colors ${task.completed ? "bg-zinc-800/30" : "bg-zinc-800/60 hover:bg-zinc-800"}`}>
            <button
                onClick={() => isAdmin && onToggle(task.id)}
                disabled={!isAdmin}
                className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isAdmin ? "border-zinc-600 hover:border-zinc-400 cursor-pointer" : "border-zinc-600 cursor-default"
                    }`}
            >
                {task.completed && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <span className={`text-sm block truncate ${task.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>{task.name}</span>
                {task.dueDate && (
                    <span className={`text-xs ${task.completed ? "text-zinc-600" : isOverdue ? "text-red-400" : isDueSoon ? "text-amber-400" : "text-zinc-500"}`}>
                        {task.completed ? "Done" : isOverdue ? `${Math.abs(dueDays!)}d overdue` : dueDays === 0 ? "Due today!" : `Due in ${dueDays}d`}
                    </span>
                )}
            </div>
            {isAdmin && (
                <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}
        </div>
    );
}
