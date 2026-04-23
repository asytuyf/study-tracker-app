import { useState, useEffect } from "react";
import { Course } from "../types";
import {
    getCurrentFocus,
    getStatus,
    getTargetChapters,
    getExpectedChapter,
    getBehindAmount,
    getCurrentChaptersPerWeek,
    getDaysUntil,
    getWeeksSinceStart,
    formatDaysUntil,
} from "../hooks/useCourses";
import ChapterGrid from "./ChapterGrid";

interface CourseCardProps {
    course: Course;
    index: number;
    onUpdate?: () => void;
    onTasks: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onQuickUpdate?: (delta: number) => void;
    onToggleChapter?: (id: string, num: number) => void;
    onToggleExercise?: (id: string, num: number) => void;
    onLogHours?: (id: string, hours: number) => void;
    isAdmin?: boolean;
}

export default function CourseCard({
    course,
    index,
    onUpdate,
    onTasks,
    onEdit,
    onDelete,
    onQuickUpdate,
    onToggleChapter,
    onToggleExercise,
    onLogHours,
    isAdmin = false,
}: CourseCardProps) {
    const [showGrid, setShowGrid] = useState(false);

    const focus = getCurrentFocus(course);
    const behind = getBehindAmount(course);
    const target = getTargetChapters(course);
    const expected = getExpectedChapter(course);

    const isProject = course.itemType === "project";
    const isCurrent = course.courseType === "current";
    const isSelfStudy = course.courseType === "self-study";
    const weeksIn = isCurrent && course.startDate ? getWeeksSinceStart(course.startDate) : null;

    const daysToExam = getDaysUntil(course.examDate);
    const dateLabel = focus.type === "midterm" && focus.milestone
        ? formatDaysUntil(getDaysUntil(focus.milestone.date), focus.milestone.name)
        : formatDaysUntil(daysToExam, isProject ? "Deadline" : "Final");

    const progressPercent = Math.min((course.completedChapters / target) * 100, 100);
    const expectedPercent = target > 0 ? Math.min((expected / target) * 100, 100) : 0;

    // Current week's hours for project — timezone-safe local date
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() + daysToMonday);
    const mondayStr = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, "0")}-${String(mondayDate.getDate()).padStart(2, "0")}`;

    const weeklyHours = (course.weeklyLogs || []).find((l: any) => l.date === mondayStr)?.hours || 0;
    const hourGoal = course.weeklyHourGoal || 10;
    const hourPercent = (weeklyHours / hourGoal) * 100;

    const isComplete = isProject
        ? weeklyHours >= hourGoal
        : course.completedChapters >= course.totalChapters;

    const isUrgent = focus.type === "midterm" && focus.milestone
        ? getDaysUntil(focus.milestone.date) <= 7 && getDaysUntil(focus.milestone.date) >= 0
        : daysToExam <= 7 && daysToExam >= 0;

    const status = getStatus(course);

    const currentRate = !isProject ? getCurrentChaptersPerWeek(course) : null;

    return (
        <div
            className={`h-full rounded-2xl p-6 animate-fade-in transition-all duration-300 relative overflow-hidden group border border-white/10 backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.05] shadow-2xl ${isComplete
                ? "ring-1 ring-emerald-500/20"
                : "ring-1 ring-white/5"
                }`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="relative z-10">
                {/* Top row */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-2">
                        <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isProject
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isCurrent
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                }`}
                        >
                            {isProject ? "Project" : isCurrent ? "Sem" : "Flex"}
                        </span>
                    </div>

                    <div className="flex gap-1.5">
                        {isComplete && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-tighter">
                                DONE
                            </span>
                        )}
                        {isUrgent && !isComplete && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 animate-pulse uppercase tracking-tighter">
                                URGENT
                            </span>
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center text-lg font-bold text-white shadow-lg`}
                    >
                        {course.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-black text-white truncate leading-tight mb-0.5">{course.name}</h3>
                        <p className="text-[11px] text-zinc-500 truncate leading-none">
                            {isCurrent && weeksIn !== null ? `Wk ${weeksIn} · ` : ""}
                            {dateLabel}
                        </p>
                    </div>
                </div>

                {isProject ? (
                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Weekly Goal</p>
                            <p className="text-sm font-black text-white">{weeklyHours} <span className="text-zinc-500 text-[10px]">/ {hourGoal}h</span></p>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-700"
                                style={{ width: `${Math.min(100, hourPercent)}%` }}
                            />
                        </div>
                        {isAdmin && (
                            <HoursInput
                                value={weeklyHours}
                                onSave={(val) => onLogHours?.(course.id, val)}
                            />
                        )}
                    </div>
                ) : (
                    <>
                        {/* Stats Grid - Compact */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-zinc-950/40 rounded-lg p-2 flex flex-col items-center justify-center border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Progress</p>
                                <p className="text-sm font-bold text-white leading-none">
                                    {course.completedChapters}<span className="text-zinc-500 text-[10px]">/{target}</span>
                                </p>
                            </div>
                            <div className="bg-zinc-950/40 rounded-lg p-2 flex flex-col items-center justify-center border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-0.5">Expected</p>
                                <div className="flex flex-col items-center">
                                    <p className={`text-sm font-bold leading-none ${status === "behind" ? "text-red-400" : "text-emerald-400"}`}>
                                        {expected}
                                    </p>
                                    {status === "behind" && !isComplete && (
                                        <p className="text-[8px] font-black text-red-500 mt-1 flex items-center gap-0.5 whitespace-nowrap">
                                            ⚠️ {behind} BEHIND
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar and rate */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
                                    <span className="uppercase font-bold tracking-wider">Progress</span>
                                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-3 bg-zinc-800 rounded-full overflow-visible relative">
                                    {/* Colored progress fill */}
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isComplete
                                            ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                            : status === "ahead"
                                                ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                                : status === "on-track"
                                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                                    : "bg-gradient-to-r from-red-500 to-orange-400"
                                            }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                    {/* White expected marker line */}
                                    {!isComplete && expectedPercent > 0 && (
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/70 rounded-full"
                                            style={{ left: `${Math.min(expectedPercent, 99)}%` }}
                                            title={`Should be at chapter ${expected}`}
                                        />
                                    )}
                                </div>
                                {!isComplete && (
                                    <p className="text-[9px] text-zinc-600 mt-1">
                                        │ = ch.{expected} · {focus.type === "midterm" && focus.milestone ? focus.milestone.name : "Final"}
                                    </p>
                                )}
                            </div>

                            {!isProject && currentRate !== null && (
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-zinc-500 uppercase font-bold tracking-tight">Rate Need</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-red-400">
                                            {currentRate}/wk
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {showGrid && !isProject && (
                    <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ChapterGrid
                            course={course}
                            onToggle={(num) => onToggleChapter?.(course.id, num)}
                            onToggleExercise={(num) => onToggleExercise?.(course.id, num)}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5">
                    {isAdmin && (
                        <>
                            {!isProject && (
                                <>
                                    <button
                                        onClick={onUpdate}
                                        className="flex-1 py-2 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-all border border-white/10 text-center"
                                    >
                                        UP
                                    </button>
                                    <button
                                        onClick={() => onQuickUpdate?.(+1)}
                                        className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-lg font-bold border border-white/5 flex items-center justify-center transition-all"
                                    >
                                        +
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    <button
                        onClick={onTasks}
                        className="flex-1 py-2 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold transition-all border border-white/10 text-center"
                    >
                        TASKS
                    </button>
                    {!isProject && (
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border border-white/5 ${showGrid ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-500 hover:text-white"}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={onEdit}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all border border-white/5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}

// ── Controlled hours input ────────────────────────────────────────────────────

function HoursInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
    const [local, setLocal] = useState(String(value));

    // Sync if parent pushes a new value (e.g. after save)
    useEffect(() => {
        setLocal(String(value));
    }, [value]);

    const commit = () => {
        const parsed = parseFloat(local);
        if (!isNaN(parsed) && parsed >= 0) onSave(parsed);
        else setLocal(String(value)); // revert on bad input
    };

    return (
        <div className="flex items-center gap-2 mt-3">
            <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
                className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm font-bold text-center focus:outline-none focus:border-amber-500 transition-colors"
            />
            <span className="text-zinc-600 text-[10px] font-bold">hrs this week</span>
        </div>
    );
}
