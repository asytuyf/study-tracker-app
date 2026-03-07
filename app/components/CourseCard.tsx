import { Course } from "../types";
import {
    getCurrentFocus,
    getStatus,
    getTargetChapters,
    getExpectedChapter,
    getBehindAmount,
    getPlannedChaptersPerWeek,
    getCurrentChaptersPerWeek,
    getDaysUntil,
    getWeeksSinceStart,
    formatDaysUntil,
} from "../hooks/useCourses";

interface CourseCardProps {
    course: Course;
    index: number;
    onUpdate?: () => void;
    onTasks: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onQuickUpdate?: (delta: number) => void;
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
    isAdmin = false,
}: CourseCardProps) {
    const focus = getCurrentFocus(course);
    const behind = getBehindAmount(course);
    const target = getTargetChapters(course);
    const expected = getExpectedChapter(course);

    const isCurrent = course.courseType === "current";
    const isSelfStudy = course.courseType === "self-study";
    const weeksIn = isCurrent && course.startDate ? getWeeksSinceStart(course.startDate) : null;

    const daysToExam = getDaysUntil(course.examDate);
    const dateLabel = focus.type === "midterm" && focus.milestone
        ? formatDaysUntil(getDaysUntil(focus.milestone.date), focus.milestone.name)
        : formatDaysUntil(daysToExam, "Final");

    const progressPercent = Math.min((course.completedChapters / target) * 100, 100);
    const expectedPercent = target > 0 ? Math.min((expected / target) * 100, 100) : 0;

    const isComplete = course.completedChapters >= course.totalChapters;
    const isUrgent = focus.type === "midterm" && focus.milestone
        ? getDaysUntil(focus.milestone.date) <= 7 && getDaysUntil(focus.milestone.date) >= 0
        : daysToExam <= 7 && daysToExam >= 0;

    const status = getStatus(course);

    const plannedRate = isSelfStudy ? getPlannedChaptersPerWeek(course) : null;
    const currentRate = isSelfStudy ? getCurrentChaptersPerWeek(course) : null;
    const rateEscalated = plannedRate !== null && currentRate !== null && currentRate > plannedRate + 0.1;

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
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCurrent
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                    >
                        {isCurrent ? "Sem" : "Flex"}
                    </span>

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
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden relative border border-white/5">
                            {/* Expected Strip (background) */}
                            {!isComplete && expectedPercent > 0 && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-700"
                                    style={{ width: `${Math.min(expectedPercent, 100)}%` }}
                                />
                            )}
                            {/* Actual Progress (foreground) */}
                            <div
                                className={`h-full relative transition-all duration-700 ${isComplete
                                    ? "bg-emerald-500"
                                    : status === "ahead"
                                        ? "bg-blue-500"
                                        : status === "on-track"
                                            ? "bg-emerald-500"
                                            : "bg-red-500"
                                    }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {isSelfStudy && plannedRate !== null && currentRate !== null && (
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500 uppercase font-bold tracking-tight">Rate Need</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${rateEscalated ? "text-red-400" : "text-purple-400"}`}>
                                    {currentRate}/wk
                                </span>
                                {rateEscalated && (
                                    <span className="text-zinc-600 font-medium">
                                        ({plannedRate})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                    {isAdmin && (
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
                    <button
                        onClick={onTasks}
                        className="flex-1 py-2 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold transition-all border border-white/10 text-center"
                    >
                        TASKS
                    </button>
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
