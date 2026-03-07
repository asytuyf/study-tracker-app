"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

export function formatDaysUntil(days: number, label: string): string {
    if (days === 0) return `${label} is Today!`;
    if (days === 1) return `${label} Tomorrow`;
    if (days === -1) return `${label} was Yesterday`;
    if (days > 0) return `${label} in ${days}d`;
    return `${label} was ${Math.abs(days)}d ago`;
}

// ─── Course logic helpers ────────────────────────────────────────────────────

export function getCurrentFocus(course: Course): "midterm" | "final" {
    if (course.courseType !== "current") return "final";
    if (!course.hasMidterm || !course.midtermDate) return "final";
    if (course.midtermCompleted) return "final";

    const daysToMidterm = getDaysUntil(course.midtermDate);
    if (daysToMidterm < 0) return "final";
    return "midterm";
}

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
            return Math.floor(progressRatio * course.totalChapters);
        }

        const weeksLeft = getWeeksUntilExam(course.examDate);
        const totalWeeksNeeded = Math.ceil(course.totalChapters);
        const weeksPassed = totalWeeksNeeded - weeksLeft;
        return Math.max(0, Math.min(weeksPassed, course.totalChapters));
    }

    return 0;
}

export function getPlannedChaptersPerWeek(course: Course): number {
    if (!course.startDate) return 0;
    const start = new Date(course.startDate).getTime();
    const end = new Date(course.examDate).getTime();
    const totalWeeks = (end - start) / (1000 * 60 * 60 * 24 * 7);
    if (totalWeeks <= 0) return course.totalChapters;
    return Math.round((course.totalChapters / totalWeeks) * 10) / 10;
}

export function getCurrentChaptersPerWeek(course: Course): number {
    const remaining = course.totalChapters - course.completedChapters;
    const weeksLeft = getWeeksUntilExam(course.examDate);
    if (weeksLeft <= 0) return remaining;
    return Math.round((remaining / weeksLeft) * 10) / 10;
}

export function getTargetChapters(course: Course): number {
    if (course.courseType === "current") {
        const focus = getCurrentFocus(course);
        if (focus === "midterm" && course.midtermChapters) {
            return course.midtermChapters;
        }
    }
    return course.totalChapters;
}

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

// ─── Save status type ─────────────────────────────────────────────────────────

export type SaveStatus = "saved" | "saving" | "pending" | "error";

// ─── Hook ────────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 3000; // Wait 3 seconds after last change before saving

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [mounted, setMounted] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const coursesRef = useRef<Course[]>(courses);

    // Keep ref in sync
    useEffect(() => {
        coursesRef.current = courses;
    }, [courses]);

    // Fetch courses on mount
    useEffect(() => {
        setMounted(true);

        fetch("/api/courses")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setCourses(data);
                }
            })
            .catch((err) => {
                console.error("Failed to load courses:", err);
                // Try localStorage as fallback
                const saved = localStorage.getItem("examCoursesV3");
                if (saved) {
                    try {
                        setCourses(JSON.parse(saved));
                    } catch {
                        // ignore
                    }
                }
            });
    }, []);

    // Debounced save function
    const scheduleSave = useCallback(() => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus("pending");

        // Schedule new save
        saveTimeoutRef.current = setTimeout(async () => {
            setSaveStatus("saving");

            try {
                // Also save to localStorage as backup
                localStorage.setItem("examCoursesV3", JSON.stringify(coursesRef.current));

                const res = await fetch("/api/courses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(coursesRef.current),
                });

                if (res.ok) {
                    setSaveStatus("saved");
                } else {
                    setSaveStatus("error");
                }
            } catch (err) {
                console.error("Failed to save:", err);
                setSaveStatus("error");
            }
        }, DEBOUNCE_MS);
    }, []);

    // Wrapper to update courses and trigger save
    const updateCourses = useCallback((updater: (prev: Course[]) => Course[]) => {
        setCourses((prev) => {
            const next = updater(prev);
            return next;
        });
        scheduleSave();
    }, [scheduleSave]);

    const handleAddCourse = useCallback(
        (data: Omit<Course, "id" | "color">) => {
            const newCourse: Course = {
                ...data,
                id: crypto.randomUUID(),
                color: COLORS[courses.length % COLORS.length],
            };
            updateCourses((prev) => [...prev, newCourse]);
        },
        [courses.length, updateCourses]
    );

    const handleEditCourse = useCallback(
        (id: string, data: Omit<Course, "id" | "color">) => {
            updateCourses((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...data } : c))
            );
        },
        [updateCourses]
    );

    const handleDeleteCourse = useCallback((id: string) => {
        updateCourses((prev) => prev.filter((c) => c.id !== id));
    }, [updateCourses]);

    const handleUpdateProgress = useCallback(
        (id: string, newProgress: number, midtermDone?: boolean) => {
            updateCourses((prev) =>
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
        [updateCourses]
    );

    const handleQuickUpdate = useCallback((id: string, delta: number) => {
        updateCourses((prev) =>
            prev.map((c) => {
                if (c.id !== id) return c;
                const next = Math.max(0, Math.min(c.totalChapters, c.completedChapters + delta));
                return { ...c, completedChapters: next };
            })
        );
    }, [updateCourses]);

    const handleToggleDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            updateCourses((prev) =>
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
        [updateCourses]
    );

    const handleAddDeliverable = useCallback(
        (courseId: string, name: string, dueDate?: string) => {
            updateCourses((prev) =>
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
        [updateCourses]
    );

    const handleDeleteDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            updateCourses((prev) =>
                prev.map((c) => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        deliverables: c.deliverables?.filter((d) => d.id !== deliverableId),
                    };
                })
            );
        },
        [updateCourses]
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
        saveStatus,
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
