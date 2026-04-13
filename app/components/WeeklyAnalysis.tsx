"use client";

import { Course, WeeklyPlanTask } from "../types";
import { useMemo, useState } from "react";

interface WeeklyAnalysisProps {
    courses: Course[];
    planTasks: WeeklyPlanTask[];
    onToggleTask: (id: string) => void;
    isAdmin?: boolean;
}

function getCurrentWeekMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

export default function WeeklyAnalysis({ courses, planTasks, onToggleTask, isAdmin }: WeeklyAnalysisProps) {
    const actualCurrentWeek = useMemo(() => getCurrentWeekMonday(), []);
    const [selectedWeek, setSelectedWeek] = useState(actualCurrentWeek);

    const weeks: string[] = useMemo(() => {
        const result: string[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(actualCurrentWeek + "T12:00:00");
            d.setDate(d.getDate() + i * 7);
            result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        }
        return result;
    }, [actualCurrentWeek]);

    function formatWeekLabel(weekDate: string): string {
        const start = new Date(weekDate + "T00:00:00");
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }

    // Filter tasks for the selected week
    const weekTasks = useMemo(() =>
        planTasks.filter(t => t.taskType !== "deadline" && t.weekDate === selectedWeek),
        [planTasks, selectedWeek]);

    // Projects with goals
    const allProjects = useMemo(() =>
        courses.filter(c => c.itemType === "project" || (c.weeklyHourGoal && c.weeklyHourGoal > 0)),
        [courses]);

    // Split projects into BSP (branch) and Main
    const bspProjects = useMemo(() => 
        allProjects.filter(p => p.name.toLowerCase().includes('bsp')), 
        [allProjects]);
        
    const mainProjects = useMemo(() => 
        allProjects.filter(p => !p.name.toLowerCase().includes('bsp')), 
        [allProjects]);

    if (weekTasks.length === 0 && allProjects.length === 0) return null;

    // Helper to render a project card
    const renderProjectCard = (p: Course, idx: number, isBranch: boolean) => {
        const log = (p.weeklyLogs || []).find(l => l.date === selectedWeek);
        const hours = log?.hours || 0;
        const goal = p.weeklyHourGoal || 10;
        const percent = Math.min(100, (hours / goal) * 100);
        const isDone = percent >= 100;
        
        // On main trunk, alternate sides unless it's a branch (which doesn't alternate but flows straight)
        const isReverse = !isBranch && (idx % 2 === 0);

        return (
            <div key={p.id} className={`relative flex flex-col sm:flex-row items-center gap-6 sm:gap-12 group ${isReverse ? 'sm:flex-row-reverse' : ''} ${isBranch ? '!flex-col sm:!flex-row !items-start sm:!gap-4' : ''}`}>
                {/* Timeline dot */}
                <div className={`absolute left-[-28px] ${isBranch ? 'sm:left-[-28px] top-6' : 'sm:left-1/2'} w-6 h-6 rounded-full border-4 bg-[#09090b] z-10 ${isBranch ? '' : 'sm:-translate-x-1/2'} transition-all duration-500 ${isDone ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110' : 'border-zinc-800 group-hover:border-cyan-500/50'}`}>
                    {isDone && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content Card */}
                <div className={`w-full ${isBranch ? 'w-full' : 'sm:w-[calc(50%-2rem)]'} p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.05] transition-all group-hover:translate-y-[-2px] ${isDone ? 'border-emerald-500/20' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{isBranch ? 'Long-Term Goal' : 'Hourly Goal'}</p>
                            <h3 className="text-lg font-black text-white">{p.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-white">{hours}<span className="text-sm text-zinc-500">/{goal}h</span></p>
                        </div>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isDone ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                {/* Date Label */}
                {!isBranch && (
                    <div className="hidden sm:block w-[calc(50%-2rem)] text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                        {isDone ? 'Target Achieved' : 'Active Progress'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-16 mb-12 animate-fade-in relative z-10">
            {/* Week selector */}
            <div className="flex justify-center mb-12 relative z-20">
                <div className="flex gap-2 group min-h-[40px] items-start hover:bg-white/[0.02] hover:p-1 hover:-m-1 rounded-[20px] transition-all w-max bg-[#09090b]/80 backdrop-blur-md">
                    {weeks.map((w: string) => {
                        const isSelected = w === selectedWeek;
                        return (
                            <button
                                key={w}
                                onClick={() => setSelectedWeek(w)}
                                className={`rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                                    isSelected
                                        ? "px-4 py-2 bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                        : "w-0 px-0 py-2 opacity-0 overflow-hidden group-hover:w-auto group-hover:px-4 group-hover:opacity-100 bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                                }`}
                            >
                                {w === actualCurrentWeek ? "This Week" : formatWeekLabel(w)}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 h-px bg-white/5" />
                <div className="text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Performance Overview</p>
                    <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Weekly Tree</h2>
                </div>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 max-w-[1400px] mx-auto items-start lg:items-center">
                
                {/* ─── MAIN TRUNK ─── */}
                <div className="relative flex-1 w-full pl-8 sm:pl-0">
                    {/* The timeline center line */}
                    <div className="absolute left-[15px] sm:left-1/2 top-[60px] bottom-4 w-[2px] bg-gradient-to-b from-blue-500/80 via-zinc-800 to-transparent sm:-translate-x-1/2 rounded-full" />

                    <div className="space-y-12 pb-10">
                        {/* 1. Projects (Non-BSP) */}
                        {mainProjects.map((p, idx) => renderProjectCard(p, idx, false))}

                        {/* 2. Manual Tasks */}
                        {weekTasks.map((task, idx) => {
                            const isEven = (mainProjects.length + idx) % 2 === 0;

                            return (
                                <div key={task.id} className={`relative flex flex-col sm:flex-row items-center gap-6 sm:gap-12 group ${isEven ? 'sm:flex-row-reverse' : ''}`}>
                                    {/* Timeline dot */}
                                    <button
                                        onClick={() => isAdmin && onToggleTask(task.id)}
                                        disabled={!isAdmin}
                                        className={`absolute left-[-28px] sm:left-1/2 w-6 h-6 rounded-full border-4 bg-[#09090b] z-10 sm:-translate-x-1/2 transition-all duration-300 ${task.done ? 'border-blue-500 bg-blue-500/20 scale-110' : 'border-zinc-800 hover:border-zinc-600'}`}
                                    >
                                        {task.done && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>

                                    {/* Content Card */}
                                    <div
                                        onClick={() => isAdmin && onToggleTask(task.id)}
                                        className={`w-full sm:w-[calc(50%-2rem)] p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.05] transition-all group-hover:translate-y-[-2px] cursor-pointer ${task.done ? 'opacity-50' : ''}`}
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 flex items-center gap-2">
                                            <span className={task.done ? "text-emerald-500" : "text-blue-400"}>✦</span>
                                            Manual Task
                                        </p>
                                        <p className={`text-sm font-medium ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                            {task.text}
                                        </p>
                                        {task.courseIds && task.courseIds.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {task.courseIds.map(cid => {
                                                    const c = courses.find(course => course.id === cid);
                                                    return c ? (
                                                        <span key={cid} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 px-2 py-0.5 rounded-full bg-white/5">
                                                            {c.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Spacing Label */}
                                    <div className="hidden sm:block w-[calc(50%-2rem)] text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic opacity-80">
                                        {task.done ? 'Checkpoint Reached' : 'Planned Objective'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── SIDE BRANCH (BSP) ─── */}
                {bspProjects.length > 0 && (
                    <div className="w-full lg:w-[320px] shrink-0 relative pl-8 mt-8 lg:mt-0 opacity-90 hover:opacity-100 transition-opacity duration-500">
                        
                        {/* Vertical branch line for the side items */}
                        <div className="absolute left-[15px] top-[100px] bottom-4 w-[2px] bg-gradient-to-b from-cyan-500/80 via-zinc-800 to-transparent rounded-full" />
                        
                        {/* Branch Title Area */}
                        <div className="relative z-10 mb-8 mt-2 lg:mt-0 flex items-center gap-3">
                            <div>
                                <h3 className="text-sm font-black text-white italic tracking-widest uppercase text-cyan-400">Long-Term Branch</h3>
                                <p className="text-[10px] text-zinc-500 font-medium">Runs parallel to main tasks</p>
                            </div>
                        </div>

                        {/* Branch Projects */}
                        <div className="space-y-8 relative z-10">
                            {bspProjects.map((p, idx) => renderProjectCard(p, idx, true))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 text-center relative z-10 hidden sm:block">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                    End of Weekly Cycle
                </p>
            </div>
        </div>
    );
}
