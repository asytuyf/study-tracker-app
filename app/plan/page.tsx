"use client";

import { useState, useMemo } from "react";
import { useCourses } from "../hooks/useCourses";
import { WeeklyPlanTask, Course } from "../types";
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
    const [newTaskText, setNewTaskText] = useState("");
    const [newTaskCourseIds, setNewTaskCourseIds] = useState<string[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    
    // New form states
    const [newTaskMode, setNewTaskMode] = useState<"weekly" | "deadline">("weekly");
    const [newTaskDeadline, setNewTaskDeadline] = useState("");

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
        handleAddPlanTask(
            newTaskText.trim(), 
            selectedWeek, // Even for deadline tasks, assign it quietly
            newTaskCourseIds, 
            newTaskMode,
            newTaskMode === "deadline" ? newTaskDeadline : undefined
        );
        setNewTaskText("");
        setNewTaskCourseIds([]);
        setNewTaskDeadline("");
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

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mb-6 group text-sm w-max">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                    </Link>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">
                        Strategic Execution
                    </p>
                    <h1 className="text-5xl font-black text-white tracking-tight">
                        Weekly <span className="text-blue-500">Plan</span> & <span className="text-cyan-400">Milestones</span>
                    </h1>
                    <div className="h-1 w-12 bg-blue-500 mt-5 rounded-full" />
                </div>

                {/* Add task form — admin only */}
                {isAdmin && (
                    <div className="mb-14 p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Add Task</p>
                            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                                <button 
                                    onClick={() => setNewTaskMode("weekly")} 
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newTaskMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Weekly Task
                                </button>
                                <button 
                                    onClick={() => setNewTaskMode("deadline")} 
                                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${newTaskMode === 'deadline' ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Deadline Mode
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                placeholder={newTaskMode === "weekly" ? "What do you need to do this week?" : "Track a major milestone or deadline"}
                                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                            />
                            {newTaskMode === "deadline" && (
                                <input
                                    type="date"
                                    value={newTaskDeadline}
                                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                                    className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                                />
                            )}
                            <button
                                onClick={handleAdd}
                                disabled={!newTaskText.trim() || (newTaskMode === "deadline" && !newTaskDeadline)}
                                className={`px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-sm transition-all ${newTaskMode === "weekly" ? "bg-blue-600 hover:bg-blue-500" : "bg-cyan-600 hover:bg-cyan-500"}`}
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

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 items-start">
                    {/* ─── LEFT COLUMN: WEEKLY PLAN ─── */}
                    <div className="flex-1 w-full relative">
                        {/* Week selector */}
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
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

                        {/* Stats */}
                        {weeklyTasks.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                    <p className="text-2xl font-black text-white">{weeklyTasks.length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Total</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                    <p className="text-2xl font-black text-emerald-400">{doneWeeklyTasks.length}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Done</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
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

                        {/* Empty state */}
                        {weeklyTasks.length === 0 && (
                            <div className="text-center py-20 rounded-3xl border border-dashed border-white/8">
                                <p className="text-zinc-600 text-3xl mb-4">✦</p>
                                <p className="text-zinc-500 font-medium text-sm">No tasks scheduled</p>
                                {isAdmin && <p className="text-zinc-700 text-xs mt-1">Add tasks above</p>}
                            </div>
                        )}

                        {/* Pending tasks */}
                        {pendingWeeklyTasks.length > 0 && (
                            <div className="mb-8">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">To Do Items</p>
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

                        {/* Done tasks */}
                        {doneWeeklyTasks.length > 0 && (
                            <div className="mb-8">
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

                    {/* ─── RIGHT COLUMN: DEADLINE TASKS (Free Mode) ─── */}
                    <div className="w-full lg:w-[450px] shrink-0">
                        <div className="p-6 rounded-3xl bg-cyan-900/5 border border-cyan-500/10 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-24 h-24 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase relative z-10">Milestone Deadlines</h2>
                            <p className="text-xs text-zinc-500 mt-1 relative z-10">Overarching tasks not bound to a specific week.</p>
                            
                            {deadlineTasks.length > 0 && (
                                <div className="mt-4 flex items-center justify-between border-t border-cyan-500/10 pt-4 relative z-10">
                                    <div className="text-left">
                                        <p className="text-2xl font-black text-cyan-400">{doneDeadlineTasks.length}<span className="text-sm text-zinc-600">/{deadlineTasks.length}</span></p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Achieved</p>
                                    </div>
                                    <div className="w-1/2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 transition-all duration-700" style={{ width: `${(doneDeadlineTasks.length / deadlineTasks.length) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {deadlineTasks.length === 0 ? (
                            <div className="text-center py-16 rounded-3xl border border-dashed border-cyan-500/20 bg-cyan-900/5">
                                <p className="text-cyan-500/50 text-2xl mb-2">⏱</p>
                                <p className="text-cyan-500/70 font-medium text-sm">No overarching deadlines.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Pending Deadlines */}
                                {pendingDeadlineTasks.length > 0 && (
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
                                    </div>
                                )}
                                
                                {/* Done Deadlines */}
                                {doneDeadlineTasks.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 ml-2 border-l-2 border-zinc-800 pl-2">Archived Milestones</p>
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
        </div>
    );
}
