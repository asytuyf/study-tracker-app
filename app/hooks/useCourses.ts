"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Course, CourseStatus } from "../types";

export const COLORS = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-sky-500 to-blue-400",
    "from-indigo-500 to-violet-400",
    "from-cyan-500 to-sky-400",
    "from-purple-500 to-indigo-400",
];

// ─── Date helpers ───────────────────────────────────────────────────────────

export function getWeeksSinceStart(startDate: string): number {
    const start = new Date(startDate);
    const today = new Date();
    const diffWeeks = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return Math.max(0, Math.floor(diffWeeks));
}

export function getWeeksUntilExam(examDate: string): number {
    const exam = new Date(examDate);
    const today = new Date();
    const diffWeeks = (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return Math.max(0, Math.ceil(diffWeeks));
}

export function getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Human-friendly countdown: "Tomorrow", "in 3 days", "Today!", "3 days ago" */
export function formatDaysUntil(days: number, label: string): string {
    if (days === 0) return `${label} is Today! 🔥`;
    if (days === 1) return `${label} Tomorrow`;
    if (days === -1) return `${label} was Yesterday`;
    if (days > 0) return `${label} in ${days}d`;
    return `${label} was ${Math.abs(days)}d ago`;
}

// ─── Course logic helpers ────────────────────────────────────────────────────

/**
 * Determine the current exam focus for a course.
 * Auto-advances to "final" if the midterm date has already passed.
 */
export function getCurrentFocus(course: Course): "midterm" | "final" {
    if (course.courseType !== "current") return "final";
    if (!course.hasMidterm || !course.midtermDate) return "final";
    if (course.midtermCompleted) return "final";

    const daysToMidterm = getDaysUntil(course.midtermDate);
    // Auto-advance: if midterm date passed, switch focus to final
    if (daysToMidterm < 0) return "final";
    return "midterm";
}

/**
 * Expected number of chapters completed by today based on pace.
 * Fixed: guards against missing startDate (restores fallback for old courses).
 */
export function getExpectedChapter(course: Course): number {
    if (course.courseType === "current") {
        if (!course.startDate) return 0;
        const weeks = getWeeksSinceStart(course.startDate);
        const focus = getCurrentFocus(course);

        if (focus === "midterm" && course.midtermChapters) {
            return Math.min(weeks, course.midtermChapters);
        }
        return Math.min(weeks, course.totalChapters);
    }

    if (course.courseType === "self-study") {
        if (course.startDate) {
            const start = new Date(course.startDate).getTime();
            const end = new Date(course.examDate).getTime();
            const now = Date.now();

            if (now <= start) return 0;
            if (now >= end) return course.totalChapters;

            const progressRatio = (now - start) / (end - start);
            // Use floor so we don't over-report — "should be AT LEAST X"
            return Math.floor(progressRatio * course.totalChapters);
        }

        // ── Fallback for old courses without startDate ──────────────────────
        // Work backwards from exam date: estimate how many weeks have elapsed
        // based on total-chapters as a proxy for total-weeks needed.
        const weeksLeft = getWeeksUntilExam(course.examDate);
        const totalWeeksNeeded = Math.ceil(course.totalChapters);
        const weeksPassed = totalWeeksNeeded - weeksLeft;
        return Math.max(0, Math.min(weeksPassed, course.totalChapters));
    }

    return 0;
}


/**
 * The ORIGINAL planned rate — fixed from the day the course was added.
 * totalChapters / totalWeeks(start → exam). This never changes.
 */
export function getPlannedChaptersPerWeek(course: Course): number {
    if (!course.startDate) return 0;
    const start = new Date(course.startDate).getTime();
    const end = new Date(course.examDate).getTime();
    const totalWeeks = (end - start) / (1000 * 60 * 60 * 24 * 7);
    if (totalWeeks <= 0) return course.totalChapters;
    return Math.round((course.totalChapters / totalWeeks) * 10) / 10;
}

/**
 * The CURRENT needed rate — how many chapters/week you NOW need to
 * finish in time, given remaining chapters and remaining weeks.
 * This climbs when you fall behind and cannot be used to determine status.
 */
export function getCurrentChaptersPerWeek(course: Course): number {
    const remaining = course.totalChapters - course.completedChapters;
    const weeksLeft = getWeeksUntilExam(course.examDate);
    if (weeksLeft <= 0) return remaining;
    return Math.round((remaining / weeksLeft) * 10) / 10;
}

/** Target chapters for current exam focus (midterm vs final) */
export function getTargetChapters(course: Course): number {
    if (course.courseType === "current") {
        const focus = getCurrentFocus(course);
        if (focus === "midterm" && course.midtermChapters) {
            return course.midtermChapters;
        }
    }
    return course.totalChapters;
}

/**
 * Status: ahead / on-track / behind.
 * Uses a 0.5-chapter buffer so minor variance doesn't flag as "behind".
 */
export function getStatus(course: Course): CourseStatus {
    const expected = getExpectedChapter(course);
    const diff = course.completedChapters - expected;

    if (diff >= 1) return "ahead";
    if (diff >= -0.5) return "on-track";
    return "behind";
}

export function getBehindAmount(course: Course): number {
    const expected = getExpectedChapter(course);
    return Math.max(0, Math.ceil(expected - course.completedChapters));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("examCoursesV3");
        if (saved) {
            try {
                setCourses(JSON.parse(saved));
            } catch {
                // corrupted data — start fresh
                setCourses([]);
            }
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("examCoursesV3", JSON.stringify(courses));
        }
    }, [courses, mounted]);

    const handleAddCourse = useCallback(
        (data: Omit<Course, "id" | "color">) => {
            const newCourse: Course = {
                ...data,
                id: crypto.randomUUID(),
                color: COLORS[courses.length % COLORS.length],
            };
            setCourses((prev) => [...prev, newCourse]);
        },
        [courses.length]
    );

    const handleEditCourse = useCallback(
        (id: string, data: Omit<Course, "id" | "color">) => {
            setCourses((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...data } : c))
            );
        },
        []
    );

    const handleDeleteCourse = useCallback((id: string) => {
        setCourses((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const handleUpdateProgress = useCallback(
        (id: string, newProgress: number, midtermDone?: boolean) => {
            setCourses((prev) =>
                prev.map((c) =>
                    c.id === id
                        ? {
                            ...c,
                            completedChapters: newProgress,
                            midtermCompleted: midtermDone ?? c.midtermCompleted,
                        }
                        : c
                )
            );
        },
        []
    );

    const handleQuickUpdate = useCallback((id: string, delta: number) => {
        setCourses((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c;
                const next = Math.max(0, Math.min(c.totalChapters, c.completedChapters + delta));
                return { ...c, completedChapters: next };
            })
        );
    }, []);

    const handleToggleDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            setCourses((prev) =>
                prev.map((c) => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        deliverables: c.deliverables?.map((d) =>
                            d.id === deliverableId ? { ...d, completed: !d.completed } : d
                        ),
                    };
                })
            );
        },
        []
    );

    const handleAddDeliverable = useCallback(
        (courseId: string, name: string, dueDate?: string) => {
            setCourses((prev) =>
                prev.map((c) => {
                    if (c.id !== courseId) return c;
                    const newDeliverable = {
                        id: crypto.randomUUID(),
                        name,
                        completed: false,
                        dueDate,
                    };
                    return { ...c, deliverables: [...(c.deliverables || []), newDeliverable] };
                })
            );
        },
        []
    );

    const handleDeleteDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            setCourses((prev) =>
                prev.map((c) => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        deliverables: c.deliverables?.filter((d) => d.id !== deliverableId),
                    };
                })
            );
        },
        []
    );

    const behindCourses = useMemo(
        () => courses.filter((c) => getStatus(c) === "behind"),
        [courses]
    );

    const sortedCourses = useMemo(
        () =>
            [...courses].sort((a, b) => {
                const aFocus = getCurrentFocus(a);
                const bFocus = getCurrentFocus(b);

                // Midterm-focused courses first
                if (aFocus === "midterm" && bFocus === "final") return -1;
                if (aFocus === "final" && bFocus === "midterm") return 1;

                const aDate = aFocus === "midterm" ? a.midtermDate! : a.examDate;
                const bDate = bFocus === "midterm" ? b.midtermDate! : b.examDate;

                return getDaysUntil(aDate) - getDaysUntil(bDate);
            }),
        [courses]
    );

    const overallProgress = useMemo(() => {
        if (courses.length === 0) return 0;
        const total = courses.reduce((s, c) => s + c.totalChapters, 0);
        const done = courses.reduce((s, c) => s + c.completedChapters, 0);
        return total === 0 ? 0 : Math.round((done / total) * 100);
    }, [courses]);

    return {
        courses,
        mounted,
        behindCourses,
        sortedCourses,
        overallProgress,
        handleAddCourse,
        handleEditCourse,
        handleDeleteCourse,
        handleUpdateProgress,
        handleQuickUpdate,
        handleToggleDeliverable,
        handleAddDeliverable,
        handleDeleteDeliverable,
    };
}
