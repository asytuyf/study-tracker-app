"use client";

import { Course, WeeklyPlanTask } from "../types";
import { useMemo } from "react";

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
    const currentWeek = useMemo(() => getCurrentWeekMonday(), []);

    // Filter tasks for this week
    const weekTasks = useMemo(() =>
        planTasks.filter(t => t.weekDate === currentWeek),
        [planTasks, currentWeek]);

    // Projects with goals
    const projects = useMemo(() =>
        courses.filter(c => c.itemType === "project" || (c.weeklyHourGoal && c.weeklyHourGoal > 0)),
        [courses]);

    if (weekTasks.length === 0 && projects.length === 0) return null;

    return (
        <div className="mt-16 mb-12 animate-fade-in">
            <div className="flex items-center gap-4 mb-10">
                <div className="flex-1 h-px bg-white/5" />
                <div className="text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Performance Overview</p>
                    <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Weekly Timeline</h2>
                </div>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="relative max-w-2xl mx-auto pl-8 sm:pl-0">
                {/* The timeline center line */}
                <div className="absolute left-[11px] sm:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/50 via-zinc-800 to-transparent sm:-translate-x-1/2" />

                <div className="space-y-12">
                    {/* 1. Projects (Arbitrary BSP etc) */}
                    {projects.map((p, idx) => {
                        const log = (p.weeklyLogs || []).find(l => l.date === currentWeek);
                        const hours = log?.hours || 0;
                        const goal = p.weeklyHourGoal || 10;
                        const percent = Math.min(100, (hours / goal) * 100);
                        const isDone = percent >= 100;

                        return (
                            <div key={p.id} className={`relative flex flex-col sm:flex-row items-center gap-6 sm:gap-12 group ${idx % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                                {/* Timeline dot */}
                                <div className={`absolute left-[-21px] sm:left-1/2 w-6 h-6 rounded-full border-4 bg-[#09090b] z-10 sm:-translate-x-1/2 transition-all duration-500 ${isDone ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110' : 'border-zinc-800 group-hover:border-blue-500/50'}`}>
                                    {isDone && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content Card */}
                                <div className={`w-full sm:w-[calc(50%-2rem)] p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.05] transition-all group-hover:translate-y-[-2px] ${isDone ? 'border-emerald-500/20' : ''}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Hourly Goal</p>
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

                                {/* Date Label (Optional placeholder or spacing) */}
                                <div className="hidden sm:block w-[calc(50%-2rem)] text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {isDone ? 'Target Achieved' : 'Active Progress'}
                                </div>
                            </div>
                        );
                    })}

                    {/* 2. Manual Tasks */}
                    {weekTasks.map((task, idx) => {
                        const isEven = (projects.length + idx) % 2 === 0;

                        return (
                            <div key={task.id} className={`relative flex flex-col sm:flex-row items-center gap-6 sm:gap-12 group ${isEven ? 'sm:flex-row-reverse' : ''}`}>
                                {/* Timeline dot */}
                                <button
                                    onClick={() => isAdmin && onToggleTask(task.id)}
                                    disabled={!isAdmin}
                                    className={`absolute left-[-21px] sm:left-1/2 w-6 h-6 rounded-full border-4 bg-[#09090b] z-10 sm:-translate-x-1/2 transition-all duration-300 ${task.done ? 'border-blue-500 bg-blue-500/20 scale-110' : 'border-zinc-800'}`}
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
                                <div className="hidden sm:block w-[calc(50%-2rem)] text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                    {task.done ? 'Checkpoint Reached' : 'Planned Objective'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-20 pt-10 border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">
                    End of Weekly Cycle
                </p>
            </div>
        </div>
    );
}
