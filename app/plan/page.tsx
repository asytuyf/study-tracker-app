"use client";

import { useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import { WeeklyPlanTask, Course } from "../types";
import Link from "next/link";
import BubbleCluster from "../components/BubbleCluster";
import { useSession } from "next-auth/react";

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
    } = useCourses();

    const currentWeek = useMemo(() => getMonday(new Date()), []);
    const [newTaskText, setNewTaskText] = useState("");
    const [newTaskCourseIds, setNewTaskCourseIds] = useState<string[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);

    // Build list of available weeks: current + 4 future
    const weeks: string[] = useMemo(() => {
        const result: string[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(currentWeek + "T12:00:00"); // noon to avoid any DST edge cases
            d.setDate(d.getDate() + i * 7);
            result.push(getMonday(d));
        }
        return result;
    }, [currentWeek]);

    const weekTasks = useMemo(
        () => planTasks.filter((t: WeeklyPlanTask) => t.weekDate === selectedWeek),
        [planTasks, selectedWeek]
    );

    const doneTasks = weekTasks.filter((t: WeeklyPlanTask) => t.done);
    const pendingTasks = weekTasks.filter((t: WeeklyPlanTask) => !t.done);

    const handleAdd = () => {
        if (!newTaskText.trim() || !isAdmin) return;
        handleAddPlanTask(newTaskText.trim(), selectedWeek, newTaskCourseIds);
        setNewTaskText("");
        setNewTaskCourseIds([]);
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

    return (
        <div className="min-h-screen pb-24 bg-[#09090b] relative">
            <div className="circuit-background" />
            <BubbleCluster side="left" />
            <BubbleCluster side="right" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mb-6 group text-sm">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                    </Link>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">
                        {formatWeekLabel(selectedWeek)}
                    </p>
                    <h1 className="text-5xl font-black text-white tracking-tight">
                        Weekly <span className="text-blue-500">Plan</span>
                    </h1>
                    <div className="h-1 w-12 bg-blue-500 mt-5 rounded-full" />
                </div>

                {/* Week selector */}
                <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
                    {weeks.map((w: string) => (
                        <button
                            key={w}
                            onClick={() => setSelectedWeek(w)}
                            className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${w === selectedWeek
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                                }`}
                        >
                            {w === currentWeek ? "This Week" : formatWeekLabel(w)}
                        </button>
                    ))}
                </div>

                {/* Add task form — admin only */}
                {isAdmin && (
                    <div className="mb-10 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Add Task</p>
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                placeholder="What do you need to do?"
                                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newTaskText.trim()}
                                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-sm transition-all"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {courses.map((c: Course) => {
                                const isSelected = newTaskCourseIds.includes(c.id);
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleCourseSelection(c.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                            ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                            : "bg-white/5 border-white/5 text-zinc-600 hover:border-white/10"
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Stats */}
                {weekTasks.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-black text-white">{weekTasks.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-black text-emerald-400">{doneTasks.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Done</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-black text-amber-400">{pendingTasks.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Remaining</p>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                {weekTasks.length > 0 && (
                    <div className="mb-10">
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                                style={{ width: `${(doneTasks.length / weekTasks.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 text-right">
                            {Math.round((doneTasks.length / weekTasks.length) * 100)}% complete
                        </p>
                    </div>
                )}

                {/* Pending tasks */}
                {pendingTasks.length > 0 && (
                    <div className="mb-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">To Do</p>
                        <div className="space-y-2">
                            {pendingTasks.map((task: WeeklyPlanTask) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] transition-all group"
                                >
                                    <button
                                        onClick={() => isAdmin && handleTogglePlanTask(task.id)}
                                        disabled={!isAdmin}
                                        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isAdmin
                                            ? "border-zinc-600 hover:border-blue-400 cursor-pointer"
                                            : "border-zinc-700 cursor-default"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-200 text-sm font-medium">{task.text}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {task.courseIds?.map(cid => {
                                                const c = courses.find(c => c.id === cid);
                                                if (!c) return null;
                                                return (
                                                    <span key={cid} className="text-[9px] font-black uppercase tracking-wider" style={{ color: getCourseColor(c) }}>
                                                        {c.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePlanTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Done tasks */}
                {doneTasks.length > 0 && (
                    <div className="mb-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Completed</p>
                        <div className="space-y-2">
                            {doneTasks.map((task: WeeklyPlanTask) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 group opacity-60 hover:opacity-80 transition-all"
                                >
                                    <button
                                        onClick={() => isAdmin && handleTogglePlanTask(task.id)}
                                        disabled={!isAdmin}
                                        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isAdmin ? "border-emerald-600 bg-emerald-600 cursor-pointer" : "border-emerald-800 bg-emerald-900 cursor-default"
                                            }`}
                                    >
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-600 text-sm line-through">{task.text}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1 opacity-50">
                                            {task.courseIds?.map(cid => {
                                                const c = courses.find(c => c.id === cid);
                                                if (!c) return null;
                                                return (
                                                    <span key={cid} className="text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                                                        {c.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePlanTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {weekTasks.length === 0 && (
                    <div className="text-center py-20 rounded-3xl border border-dashed border-white/8">
                        <p className="text-zinc-600 text-4xl mb-4">✦</p>
                        <p className="text-zinc-500 font-medium">No tasks for this week yet</p>
                        {isAdmin && <p className="text-zinc-700 text-sm mt-1">Add something above to get started</p>}
                        {!isAdmin && <p className="text-zinc-700 text-sm mt-1">Sign in as admin to add tasks</p>}
                    </div>
                )}
            </div>
        </div >
    );
}
