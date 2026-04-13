"use client";

import { useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import { WeeklyPlanTask, Course, Subtask } from "../types";
import Link from "next/link";
import BubbleCluster from "../components/BubbleCluster";
import { useSession } from "next-auth/react";
import PlanTaskCard from "../components/PlanTaskCard";

function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getMonday(d: Date): string {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return localDateStr(monday);
}

function formatWeekLabel(weekDate: string): string {
    const start = new Date(weekDate + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function PlanPage() {
    const { data: session } = useSession();
    const isAdmin = !!session;

    const {
        courses,
        planTasks,
        mounted,
        handleAddPlanTask,
        handleTogglePlanTask,
        handleDeletePlanTask,
        handleUpdatePlanTask,
    } = useCourses();

    const currentWeek = useMemo(() => getMonday(new Date()), []);
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);

    // Add form state
    const [newTaskMode, setNewTaskMode] = useState<"weekly" | "deadline">("weekly");
    const [newTaskText, setNewTaskText] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskDeadline, setNewTaskDeadline] = useState("");
    const [newTaskCourseIds, setNewTaskCourseIds] = useState<string[]>([]);
    const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
    const [newSubtaskInput, setNewSubtaskInput] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    const weeks: string[] = useMemo(() => {
        const result: string[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(currentWeek + "T12:00:00");
            d.setDate(d.getDate() + i * 7);
            result.push(getMonday(d));
        }
        return result;
    }, [currentWeek]);

    const weeklyTasks = useMemo(
        () => planTasks.filter((t: WeeklyPlanTask) => t.taskType !== "deadline" && t.weekDate === selectedWeek),
        [planTasks, selectedWeek]
    );

    const deadlineTasks = useMemo(
        () => planTasks.filter((t: WeeklyPlanTask) => t.taskType === "deadline").sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }),
        [planTasks]
    );

    const doneWeeklyTasks = weeklyTasks.filter((t: WeeklyPlanTask) => t.done);
    const pendingWeeklyTasks = weeklyTasks.filter((t: WeeklyPlanTask) => !t.done);
    const doneDeadlineTasks = deadlineTasks.filter((t: WeeklyPlanTask) => t.done);
    const pendingDeadlineTasks = deadlineTasks.filter((t: WeeklyPlanTask) => !t.done);

    const handleAdd = () => {
        if (!newTaskText.trim() || !isAdmin) return;
        if (newTaskMode === "deadline" && !newTaskDeadline) return;

        const builtSubtasks: Subtask[] = newSubtasks.map(text => ({
            id: crypto.randomUUID(),
            text,
            done: false,
        }));

        handleAddPlanTask(
            newTaskText.trim(),
            selectedWeek,
            newTaskCourseIds,
            newTaskMode,
            newTaskMode === "deadline" ? newTaskDeadline : undefined,
            newTaskDesc.trim() || undefined,
        );

        // We need to update subtasks after creation if any were added
        // handleAddPlanTask creates the task; we'll handle subtasks via onUpdate after

        setNewTaskText("");
        setNewTaskDesc("");
        setNewTaskDeadline("");
        setNewTaskCourseIds([]);
        setNewSubtasks([]);
        setNewSubtaskInput("");
        setShowAddForm(false);

        // If subtasks exist, update the just-added task
        if (builtSubtasks.length > 0) {
            // Find it by matching latest task
            setTimeout(() => {
                const latest = [...planTasks].reverse().find(t =>
                    t.taskType === newTaskMode
                );
                if (latest) handleUpdatePlanTask(latest.id, { subtasks: builtSubtasks });
            }, 100);
        }
    };

    const addDraftSubtask = () => {
        if (!newSubtaskInput.trim()) return;
        setNewSubtasks(prev => [...prev, newSubtaskInput.trim()]);
        setNewSubtaskInput("");
    };

    const removeDraftSubtask = (i: number) => {
        setNewSubtasks(prev => prev.filter((_, idx) => idx !== i));
    };

    const toggleCourseSelection = (id: string) => {
        setNewTaskCourseIds(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const getCourseColor = (course: Course) => {
        if (course.color.includes("blue")) return "#60a5fa";
        if (course.color.includes("violet")) return "#a78bfa";
        if (course.color.includes("purple")) return "#c084fc";
        if (course.color.includes("cyan")) return "#22d3ee";
        if (course.color.includes("emerald")) return "#34d399";
        if (course.color.includes("amber")) return "#fbbf24";
        if (course.color.includes("orange")) return "#fb923c";
        if (course.color.includes("rose")) return "#fb7185";
        return "#94a3b8";
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const glassCard = "bg-white/[0.03] border border-white/10 backdrop-blur-xl ring-1 ring-white/5";

    return (
        <div className="min-h-screen pb-24 bg-[#09090b] relative">
            <div className="circuit-background" />
            <BubbleCluster side="left" />
            <BubbleCluster side="right" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mb-6 group text-sm w-max">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                    </Link>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">Strategic Execution</p>
                    <h1 className="text-5xl font-black text-white tracking-tight">
                        Weekly <span className="text-blue-500">Plan</span>
                    </h1>
                    <div className="h-1 w-12 bg-blue-500 mt-5 rounded-full" />
                </div>

                {/* Week selector — always visible */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
                    {weeks.map((w) => (
                        <button
                            key={w}
                            onClick={() => setSelectedWeek(w)}
                            className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                w === selectedWeek
                                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                    : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300 border border-white/5"
                            }`}
                        >
                            {w === currentWeek ? "This Week" : formatWeekLabel(w)}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                {weeklyTasks.length > 0 && (
                    <div className={`grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl ${glassCard}`}>
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">{weeklyTasks.length}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-emerald-400">{doneWeeklyTasks.length}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Done</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-amber-400">{pendingWeeklyTasks.length}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Remaining</p>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                {weeklyTasks.length > 0 && (
                    <div className="mb-8">
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                                style={{ width: `${(doneWeeklyTasks.length / weeklyTasks.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 text-right">
                            {Math.round((doneWeeklyTasks.length / weeklyTasks.length) * 100)}% complete
                        </p>
                    </div>
                )}

                {/* Add Task Form — Admin only */}
                {isAdmin && (
                    <div className={`mb-8 rounded-3xl ${glassCard} overflow-hidden transition-all`}>
                        {/* Form header — always visible toggle */}
                        <button
                            onClick={() => setShowAddForm(v => !v)}
                            className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${showAddForm ? 'bg-blue-600' : 'bg-white/10'}`}>
                                    <svg className={`w-3.5 h-3.5 text-white transition-transform ${showAddForm ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Add Task</p>
                            </div>
                            {/* Mode pills */}
                            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setNewTaskMode("weekly")}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newTaskMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >Weekly</button>
                                <button
                                    onClick={() => setNewTaskMode("deadline")}
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newTaskMode === 'deadline' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >Deadline</button>
                            </div>
                        </button>

                        {showAddForm && (
                            <div className="px-5 pb-5 border-t border-white/5 pt-5 space-y-4">
                                {/* Task name */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Task Name</label>
                                    <input
                                        type="text"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                        placeholder={newTaskMode === "weekly" ? "What do you need to do?" : "Name this milestone..."}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                                        autoFocus
                                    />
                                </div>

                                {/* Deadline date (only for deadline mode) */}
                                {newTaskMode === "deadline" && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Deadline Date</label>
                                        <input
                                            type="date"
                                            value={newTaskDeadline}
                                            onChange={(e) => setNewTaskDeadline(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                                        />
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Description <span className="opacity-40 normal-case tracking-normal font-normal">optional</span></label>
                                    <textarea
                                        value={newTaskDesc}
                                        onChange={(e) => setNewTaskDesc(e.target.value)}
                                        placeholder="Add context, links, or requirements..."
                                        rows={2}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
                                    />
                                </div>

                                {/* Subtasks */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Subtasks <span className="opacity-40 normal-case tracking-normal font-normal">optional</span></label>
                                    {newSubtasks.length > 0 && (
                                        <div className="mb-3 space-y-1.5">
                                            {newSubtasks.map((st, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
                                                    <div className="w-3 h-3 rounded border border-zinc-600 flex-shrink-0" />
                                                    <span className="text-sm text-zinc-300 flex-1">{st}</span>
                                                    <button onClick={() => removeDraftSubtask(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubtaskInput}
                                            onChange={(e) => setNewSubtaskInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addDraftSubtask()}
                                            placeholder="Add a step..."
                                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                                        />
                                        <button
                                            onClick={addDraftSubtask}
                                            disabled={!newSubtaskInput.trim()}
                                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-zinc-400 text-xs font-bold disabled:opacity-30 transition-all"
                                        >+ Add</button>
                                    </div>
                                </div>

                                {/* Course tags */}
                                {courses.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Link to Course</label>
                                        <div className="flex flex-wrap gap-2">
                                            {courses.map((c: Course) => {
                                                const isSelected = newTaskCourseIds.includes(c.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => toggleCourseSelection(c.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                                            : "bg-white/5 border-white/5 text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                                                        }`}
                                                    >{c.name}</button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => { setShowAddForm(false); setNewTaskText(""); setNewTaskDesc(""); setNewSubtasks([]); setNewSubtaskInput(""); setNewTaskCourseIds([]); setNewTaskDeadline(""); }}
                                        className="flex-1 py-2.5 rounded-2xl text-zinc-500 hover:text-zinc-300 text-sm font-bold transition-all border border-white/5 hover:border-white/10"
                                    >Cancel</button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!newTaskText.trim() || (newTaskMode === "deadline" && !newTaskDeadline)}
                                        className={`flex-1 py-2.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${newTaskMode === "weekly" ? "bg-blue-600 hover:bg-blue-500" : "bg-cyan-600 hover:bg-cyan-500"}`}
                                    >Add Task</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── WEEKLY TASKS ─── */}
                {weeklyTasks.length === 0 ? (
                    <div className="text-center py-20 rounded-3xl border border-dashed border-white/8 mb-8">
                        <p className="text-zinc-600 text-3xl mb-4">✦</p>
                        <p className="text-zinc-500 font-medium text-sm">No tasks this week yet</p>
                        {isAdmin && <p className="text-zinc-700 text-xs mt-1">Click "+ Add Task" above to get started</p>}
                    </div>
                ) : (
                    <div className="mb-12 space-y-3">
                        {pendingWeeklyTasks.length > 0 && (
                            <div className="mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">To Do</p>
                                <div className="space-y-3">
                                    {pendingWeeklyTasks.map((task: WeeklyPlanTask) => (
                                        <PlanTaskCard
                                            key={task.id}
                                            task={task}
                                            courses={courses}
                                            isAdmin={isAdmin}
                                            getCourseColor={getCourseColor}
                                            onToggle={handleTogglePlanTask}
                                            onDelete={handleDeletePlanTask}
                                            onUpdate={handleUpdatePlanTask}
                                            isDeadlineMode={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {doneWeeklyTasks.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Completed</p>
                                <div className="space-y-3">
                                    {doneWeeklyTasks.map((task: WeeklyPlanTask) => (
                                        <PlanTaskCard
                                            key={task.id}
                                            task={task}
                                            courses={courses}
                                            isAdmin={isAdmin}
                                            getCourseColor={getCourseColor}
                                            onToggle={handleTogglePlanTask}
                                            onDelete={handleDeletePlanTask}
                                            onUpdate={handleUpdatePlanTask}
                                            isDeadlineMode={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MILESTONE DEADLINES ─── */}
                <div className="mt-4">
                    <div className={`p-5 rounded-2xl ${glassCard} mb-6`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">Milestone Deadlines</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">Overarching goals not bound to a specific week</p>
                            </div>
                            {deadlineTasks.length > 0 && (
                                <div className="text-right">
                                    <p className="text-xl font-black text-cyan-400">{doneDeadlineTasks.length}<span className="text-xs text-zinc-600">/{deadlineTasks.length}</span></p>
                                    <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-cyan-500 transition-all" style={{ width: `${(doneDeadlineTasks.length / deadlineTasks.length) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {deadlineTasks.length === 0 ? (
                        <div className="text-center py-12 rounded-3xl border border-dashed border-white/8">
                            <p className="text-zinc-600 text-sm">No milestones yet</p>
                            {isAdmin && <p className="text-zinc-700 text-xs mt-1">Switch to Deadline mode above to add one</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingDeadlineTasks.map(task => (
                                <PlanTaskCard
                                    key={task.id}
                                    task={task}
                                    courses={courses}
                                    isAdmin={isAdmin}
                                    getCourseColor={getCourseColor}
                                    onToggle={handleTogglePlanTask}
                                    onDelete={handleDeletePlanTask}
                                    onUpdate={handleUpdatePlanTask}
                                    isDeadlineMode={true}
                                />
                            ))}
                            {doneDeadlineTasks.length > 0 && (
                                <div className="pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Archived</p>
                                    <div className="space-y-3">
                                        {doneDeadlineTasks.map(task => (
                                            <PlanTaskCard
                                                key={task.id}
                                                task={task}
                                                courses={courses}
                                                isAdmin={isAdmin}
                                                getCourseColor={getCourseColor}
                                                onToggle={handleTogglePlanTask}
                                                onDelete={handleDeletePlanTask}
                                                onUpdate={handleUpdatePlanTask}
                                                isDeadlineMode={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
