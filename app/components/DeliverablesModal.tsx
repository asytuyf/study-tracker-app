"use client";

import { useState } from "react";
import { Course, Deliverable } from "../types";
import { getDaysUntil } from "../hooks/useCourses";

interface DeliverablesModalProps {
    course: Course;
    onToggle: (id: string) => void;
    onAdd: (name: string, dueDate?: string) => void;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim() || !isAdmin) return;
        onAdd(newTask.trim(), newDueDate || undefined);
        setNewTask("");
        setNewDueDate("");
    };

    // Sort: incomplete first, then completed
    const sorted: Deliverable[] = [
        ...(course.deliverables?.filter((d) => !d.completed) ?? []),
        ...(course.deliverables?.filter((d) => d.completed) ?? []),
    ];

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
                        <h2 className="text-2xl font-bold text-white">Assignments & Sheets</h2>
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

                {/* Notion Link */}
                {course.notionLink && (
                    <a
                        href={course.notionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border border-white/10 hover:border-white/20 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.877.466L16.793.013c1.682-.14 2.101.093 2.801.606l3.876 2.707c.467.327.607.746.607 1.26v17.317c0 1.027-.373 1.635-1.682 1.728l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.107C1.053 1.08 1.426.56 2.877.466z"/>
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm">Open Notes in Notion</p>
                            <p className="text-zinc-500 text-xs truncate">View slides, summaries & resources</p>
                        </div>
                        <svg className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
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
                            <p className="text-sm">No assignments added yet</p>
                            {isAdmin && <p className="text-xs mt-1 text-zinc-700">Add one below</p>}
                        </div>
                    )}

                    {sorted.map((task) => {
                        const dueDays = task.dueDate ? getDaysUntil(task.dueDate) : null;
                        const isOverdue = dueDays !== null && dueDays < 0 && !task.completed;
                        const isDueSoon = dueDays !== null && dueDays >= 0 && dueDays <= 3 && !task.completed;

                        return (
                            <div
                                key={task.id}
                                className={`flex items-center gap-3 p-3 rounded-xl group transition-colors ${task.completed ? "bg-zinc-800/30" : "bg-zinc-800/60 hover:bg-zinc-800"
                                    }`}
                            >
                                {/* Checkbox - admin only can toggle */}
                                <button
                                    onClick={() => isAdmin && onToggle(task.id)}
                                    disabled={!isAdmin}
                                    className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.completed
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : isAdmin
                                            ? "border-zinc-600 hover:border-zinc-400 cursor-pointer"
                                            : "border-zinc-600 cursor-default"
                                        }`}
                                >
                                    {task.completed && (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>

                                {/* Name + due date */}
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm block truncate ${task.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                                        {task.name}
                                    </span>
                                    {task.dueDate && (
                                        <span
                                            className={`text-xs ${task.completed
                                                ? "text-zinc-600"
                                                : isOverdue
                                                    ? "text-red-400"
                                                    : isDueSoon
                                                        ? "text-amber-400"
                                                        : "text-zinc-500"
                                                }`}
                                        >
                                            {task.completed
                                                ? "Done"
                                                : isOverdue
                                                    ? `${Math.abs(dueDays!)}d overdue`
                                                    : dueDays === 0
                                                        ? "Due today!"
                                                        : `Due in ${dueDays}d`}
                                        </span>
                                    )}
                                </div>

                                {/* Delete - admin only */}
                                {isAdmin && (
                                    <button
                                        onClick={() => onDelete(task.id)}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add form - admin only */}
                {isAdmin && (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Assignment / problem set name..."
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="text-xs text-zinc-500 whitespace-nowrap">Due date (optional):</label>
                            <input
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
