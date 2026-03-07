"use client";

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
    const status = getStatus(course);
    const focus = getCurrentFocus(course);
    const behind = getBehindAmount(course);
    const target = getTargetChapters(course);
    const expected = getExpectedChapter(course);

    const isCurrent = course.courseType === "current";
    const isSelfStudy = course.courseType === "self-study";
    const weeksIn = isCurrent && course.startDate ? getWeeksSinceStart(course.startDate) : null;

    const relevantDate = focus === "midterm" ? course.midtermDate! : course.examDate;
    const daysLeft = getDaysUntil(relevantDate);

    const progressPercent = Math.min((course.completedChapters / target) * 100, 100);
    const expectedPercent = target > 0 ? Math.min((expected / target) * 100, 100) : 0;

    const isComplete = course.completedChapters >= course.totalChapters;
    const isUrgent = !isComplete && daysLeft >= 0 && daysLeft <= 7;
    const plannedRate = isSelfStudy ? getPlannedChaptersPerWeek(course) : null;
    const currentRate = isSelfStudy ? getCurrentChaptersPerWeek(course) : null;
    const rateEscalated = plannedRate !== null && currentRate !== null && currentRate > plannedRate + 0.1;

    const focusLabel = focus === "midterm" ? "Midterm" : "Final";
    const dateLabel = formatDaysUntil(daysLeft, focusLabel);

    return (
        <div
            className={`glass rounded-2xl p-4 sm:p-6 animate-fade-in transition-all duration-300 ${isComplete
                ? "ring-2 ring-emerald-500/40 complete-glow"
                : isUrgent
                    ? "urgent-ring ring-2 ring-amber-500/40"
                    : focus === "midterm"
                        ? "ring-2 ring-amber-500/30"
                        : "hover:bg-white/[0.04]"
                }`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Top badges row */}
            <div className="flex justify-between mb-3 gap-2 flex-wrap">
                <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${isCurrent
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                >
                    {isCurrent ? "Semester" : "Flexible"}
                </span>

                <div className="flex gap-2">
                    {isComplete && (
                        <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                            Complete!
                        </span>
                    )}
                    {isUrgent && !isComplete && (
                        <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 animate-pulse-glow">
                            Urgent
                        </span>
                    )}
                    {focus === "midterm" && !isComplete && (
                        <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                            MIDTERM
                        </span>
                    )}
                </div>
            </div>

            {/* Card header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-xl font-bold text-white shadow-lg`}
                    >
                        {course.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">{course.name}</h3>
                        <p className="text-sm text-zinc-500">
                            {isCurrent && weeksIn !== null ? `Week ${weeksIn} · ` : ""}
                            {dateLabel}
                        </p>
                    </div>
                </div>
                <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${isComplete
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : status === "ahead"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : status === "on-track"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                >
                    {isComplete
                        ? "Done"
                        : status === "ahead"
                            ? "Ahead"
                            : status === "on-track"
                                ? "On Track"
                                : "Behind"}
                </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Done</p>
                    <p className="text-xl font-bold text-white">
                        {course.completedChapters}
                        <span className="text-zinc-500 text-base">/{target}</span>
                    </p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Should be</p>
                    <p className={`text-xl font-bold ${status === "behind" ? "text-red-400" : "text-emerald-400"}`}>
                        {expected}
                    </p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                        {isSelfStudy ? "Rate" : focusLabel}
                    </p>
                    {isSelfStudy && plannedRate !== null && currentRate !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                            <p className={`text-lg font-bold leading-none ${rateEscalated ? "text-red-400" : "text-purple-300"}`}>
                                {currentRate}<span className="text-xs text-zinc-500">/wk</span>
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-none">
                                {rateEscalated ? `from ${plannedRate}/wk` : `plan: ${plannedRate}/wk`}
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg font-bold text-white">
                            {daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? "Today" : "Past"}
                            {daysLeft > 0 && <span className="text-xs text-zinc-500"> left</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-zinc-300 font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
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
                    {!isComplete && expectedPercent > 0 && (
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/70 rounded-full"
                            style={{ left: `${expectedPercent}%` }}
                            title={`Should be at chapter ${expected}`}
                        />
                    )}
                </div>
                {!isComplete && (
                    <p className="text-xs text-zinc-600 mt-1.5">
                        White line = where you should be ({expected})
                    </p>
                )}
            </div>

            {/* Behind warning */}
            {status === "behind" && !isComplete && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 text-sm font-medium">
                        Behind by {behind} chapter{behind > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {/* Deliverables preview */}
            {(course.deliverables?.length ?? 0) > 0 && (
                <div
                    onClick={onTasks}
                    className="cursor-pointer bg-black/20 rounded-xl p-3 mb-4 hover:bg-black/30 transition-colors"
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            Assignments / Sheets
                        </span>
                        <span className="text-xs text-zinc-500">
                            {course.deliverables?.filter((d) => d.completed).length}/{course.deliverables?.length}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {course.deliverables?.slice(0, 2).map((d) => (
                            <div key={d.id} className="flex items-center gap-2 text-sm text-zinc-300">
                                <div className={`w-2 h-2 rounded-full ${d.completed ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                <span className={d.completed ? "line-through opacity-50" : ""}>{d.name}</span>
                                {d.dueDate && !d.completed && (
                                    <span className="ml-auto text-xs text-zinc-500">
                                        {getDaysUntil(d.dueDate)}d
                                    </span>
                                )}
                            </div>
                        ))}
                        {(course.deliverables?.length ?? 0) > 2 && (
                            <p className="text-xs text-zinc-500 pl-4">
                                + {(course.deliverables?.length ?? 0) - 2} more
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Actions - only show admin actions if authenticated */}
            <div className="flex flex-col gap-3">
                {/* Quick chapter buttons - admin only */}
                {isAdmin && !isComplete && onQuickUpdate && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 flex-1">Quick update:</span>
                        <button
                            onClick={() => onQuickUpdate(-1)}
                            disabled={course.completedChapters <= 0}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none flex items-center justify-center"
                            title="Remove one chapter"
                        >
                            -
                        </button>
                        <span className="text-white font-bold w-8 text-center">{course.completedChapters}</span>
                        <button
                            onClick={() => onQuickUpdate(+1)}
                            disabled={course.completedChapters >= course.totalChapters}
                            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none flex items-center justify-center"
                            title="Add one chapter"
                        >
                            +
                        </button>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Update button - admin only */}
                    {isAdmin && onUpdate && (
                        <button
                            onClick={onUpdate}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-300 text-sm ${status === "behind" && !isComplete
                                ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                                }`}
                        >
                            Update
                        </button>
                    )}

                    <div className="flex gap-2">
                        {/* Tasks button - always visible */}
                        <button
                            onClick={onTasks}
                            className="flex-1 sm:flex-none py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center justify-center gap-2"
                            title="View Assignments"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span className="sm:hidden">Tasks</span>
                        </button>

                        {/* Edit button - admin only */}
                        {isAdmin && onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex-1 sm:flex-none py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                title="Edit Course & Dates"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Edit
                            </button>
                        )}

                        {/* Delete button - admin only */}
                        {isAdmin && onDelete && (
                            <button
                                onClick={onDelete}
                                className="flex-1 sm:flex-none py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-red-900/50 text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center"
                                title="Delete Course"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="sm:hidden ml-2">Delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
