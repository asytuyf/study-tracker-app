"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Course, CourseStatus, Milestone, WeeklyPlanTask } from "../types";

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

export function getCurrentFocus(course: Course): { type: "midterm" | "final"; milestone?: Milestone } {
    if (course.courseType !== "current") return { type: "final" };
    if (!course.midterms || course.midterms.length === 0) return { type: "final" };

    // Find the first milestone that is NOT completed and NOT in the past
    // Or if it is in the past but NOT completed, it's still the focus
    const activeMidterm = course.midterms.find(m => !m.completed);

    if (!activeMidterm) return { type: "final" };

    return { type: "midterm", milestone: activeMidterm };
}

export function getExpectedChapter(course: Course): number {
    if (course.courseType === "current") {
        if (!course.startDate) return 0;
        const weeks = getWeeksSinceStart(course.startDate);
        const focus = getCurrentFocus(course);

        if (focus.type === "midterm" && focus.milestone) {
            return Math.min(weeks, focus.milestone.chapters);
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
        if (focus.type === "midterm" && focus.milestone) {
            return focus.milestone.chapters;
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
    const [planTasks, setPlanTasks] = useState<WeeklyPlanTask[]>([]);
    const [mounted, setMounted] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const coursesRef = useRef<Course[]>(courses);
    const planTasksRef = useRef<WeeklyPlanTask[]>(planTasks);

    // Keep refs in sync
    useEffect(() => {
        coursesRef.current = courses;
    }, [courses]);

    useEffect(() => {
        planTasksRef.current = planTasks;
    }, [planTasks]);

    // Fetch courses on mount
    useEffect(() => {
        setMounted(true);

        // 1. Load from localStorage immediately so cross-page navigation stays in sync
        const localRaw = localStorage.getItem("examCoursesV3");
        let loadedFromLocal = false;
        if (localRaw) {
            try {
                const parsed = JSON.parse(localRaw);
                if (Array.isArray(parsed)) {
                    setCourses(parsed);
                } else {
                    setCourses(parsed.courses || []);
                    setPlanTasks(parsed.planTasks || []);
                    coursesRef.current = parsed.courses || [];
                    planTasksRef.current = parsed.planTasks || [];
                }
                loadedFromLocal = true;
            } catch {
                // ignore parse errors
            }
        }

        // 2. Fetch from API in background to pick up any server-side changes
        fetch("/api/courses")
            .then((res) => res.json())
            .then((data) => {
                // If the save queue is pending/saving, skip API override to avoid
                // overwriting local changes that haven't reached the server yet
                if (saveTimeoutRef.current) return;

                // Support both old array format and new object format { courses, planTasks }
                const rawCourses: any[] = Array.isArray(data) ? data : (data.courses || []);
                const rawPlanTasks: WeeklyPlanTask[] = Array.isArray(data) ? [] : (data.planTasks || []);

                const migrated = rawCourses.map((course: any) => {
                    let updated: Course = { ...course };
                    if (!updated.itemType) updated.itemType = "course";
                    if (!updated.weeklyLogs) updated.weeklyLogs = [];
                    if (!updated.chapterSchedule) updated.chapterSchedule = [];

                    if (course.hasMidterm && course.midtermDate && !course.midterms) {
                        const milestone: Milestone = {
                            id: crypto.randomUUID(),
                            name: "Midterm",
                            date: course.midtermDate,
                            chapters: course.midtermChapters || 0,
                            completed: course.midtermCompleted || false
                        };
                        const { hasMidterm, midtermDate, midtermChapters, midtermCompleted, ...rest } = updated as any;
                        updated = { ...rest, midterms: [milestone] };
                    }
                    return updated;
                });

                setCourses(migrated);
                setPlanTasks(rawPlanTasks);
            })
            .catch((err) => {
                console.error("Failed to load courses from API:", err);
                // Already loaded from localStorage above — nothing else to do
                if (!loadedFromLocal) {
                    console.error("No local data either:", err);
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
                const payload = { courses: coursesRef.current, planTasks: planTasksRef.current };
                localStorage.setItem("examCoursesV3", JSON.stringify(payload));

                const res = await fetch("/api/courses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
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

    // Wrappers to update data and trigger save
    const updateCourses = useCallback((updater: (prev: Course[]) => Course[]) => {
        setCourses((prev: Course[]) => {
            const next = updater(prev);
            return next;
        });
        scheduleSave();
    }, [scheduleSave]);

    const updatePlanTasks = useCallback((updater: (prev: WeeklyPlanTask[]) => WeeklyPlanTask[]) => {
        setPlanTasks((prev: WeeklyPlanTask[]) => {
            const next = updater(prev);
            planTasksRef.current = next;
            return next;
        });
        scheduleSave();
    }, [scheduleSave]);

    const handleAddCourse = useCallback(
        (data: Omit<Course, "id" | "color">) => {
            const newCourse: Course = {
                ...data,
                id: crypto.randomUUID(),
                color: COLORS[coursesRef.current.length % COLORS.length],
            } as Course;
            updateCourses((prev: Course[]) => [...prev, newCourse]);
        },
        [updateCourses]
    );

    const handleEditCourse = useCallback(
        (id: string, data: Omit<Course, "id" | "color">) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => (c.id === id ? { ...c, ...data } : c))
            );
        },
        [updateCourses]
    );

    const handleDeleteCourse = useCallback((id: string) => {
        updateCourses((prev: Course[]) => prev.filter((c: Course) => c.id !== id));
    }, [updateCourses]);

    const handleUpdateProgress = useCallback(
        (id: string, newProgress: number, milestoneId?: string, milestoneDone?: boolean) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== id) return c;

                    let nextMidterms = c.midterms;
                    if (milestoneId) {
                        nextMidterms = c.midterms?.map((m: Milestone) =>
                            m.id === milestoneId ? { ...m, completed: milestoneDone ?? m.completed } : m
                        );
                    }

                    return {
                        ...c,
                        completedChapters: newProgress,
                        midterms: nextMidterms,
                    };
                })
            );
        },
        [updateCourses]
    );

    const handleQuickUpdate = useCallback((id: string, delta: number) => {
        updateCourses((prev: Course[]) =>
            prev.map((c: Course) => {
                if (c.id !== id) return c;
                const next = Math.max(0, Math.min(c.totalChapters, c.completedChapters + delta));
                return { ...c, completedChapters: next };
            })
        );
    }, [updateCourses]);

    const handleToggleDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        deliverables: c.deliverables?.map((d: any) =>
                            d.id === deliverableId ? { ...d, completed: !d.completed } : d
                        ),
                    };
                })
            );
        },
        [updateCourses]
    );

    const handleAddDeliverable = useCallback(
        (courseId: string, name: string, dueDate?: string, category?: "implementation" | "scientific") => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== courseId) return c;
                    const newDeliverable = {
                        id: crypto.randomUUID(),
                        name,
                        completed: false,
                        dueDate,
                        category,
                    };
                    return { ...c, deliverables: [...(c.deliverables || []), newDeliverable] };
                })
            );
        },
        [updateCourses]
    );

    const handleLogHours = useCallback(
        (id: string, weekDate: string, hours: number) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== id) return c;
                    const logs = c.weeklyLogs || [];
                    const existingLog = logs.find((l: any) => l.date === weekDate);
                    let newLogs;
                    if (existingLog) {
                        newLogs = logs.map((l: any) => (l.date === weekDate ? { ...l, hours } : l));
                    } else {
                        newLogs = [...logs, { id: crypto.randomUUID(), date: weekDate, hours }];
                    }
                    return { ...c, weeklyLogs: newLogs };
                })
            );
        },
        [updateCourses]
    );

    const handleToggleChapter = useCallback(
        (courseId: string, chapterNum: number) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== courseId) return c;
                    const isDone = (c.completedChapters || 0) >= chapterNum;
                    const next = isDone ? chapterNum - 1 : chapterNum;
                    return { ...c, completedChapters: Math.max(0, next) };
                })
            );
        },
        [updateCourses]
    );

    const handleDeleteDeliverable = useCallback(
        (courseId: string, deliverableId: string) => {
            updateCourses((prev: Course[]) =>
                prev.map((c: Course) => {
                    if (c.id !== courseId) return c;
                    return {
                        ...c,
                        deliverables: c.deliverables?.filter((d: any) => d.id !== deliverableId),
                    };
                })
            );
        },
        [updateCourses]
    );

    // ─── Weekly Plan Task handlers ────────────────────────────────────────────

    const handleAddPlanTask = useCallback((text: string, weekDate: string, courseIds?: string[], taskType: "weekly" | "deadline" = "weekly", deadline?: string, description?: string) => {
        const task: WeeklyPlanTask = {
            id: crypto.randomUUID(),
            text: text.trim(),
            done: false,
            courseIds: courseIds || [],
            weekDate,
            taskType,
            deadline,
            description,
            subtasks: []
        };
        updatePlanTasks((prev: WeeklyPlanTask[]) => [...prev, task]);
    }, [updatePlanTasks]);

    const handleUpdatePlanTask = useCallback((id: string, updates: Partial<WeeklyPlanTask>) => {
        updatePlanTasks((prev: WeeklyPlanTask[]) =>
            prev.map((t: WeeklyPlanTask) => {
                if (t.id === id) {
                    const updated = { ...t, ...updates };
                    // If subtasks array is sent, check for auto-completion
                    if (updates.subtasks !== undefined && updated.subtasks && updated.subtasks.length > 0) {
                        updated.done = updated.subtasks.every((st: any) => st.done);
                    }
                    return updated;
                }
                return t;
            })
        );
    }, [updatePlanTasks]);

    const handleTogglePlanTask = useCallback((id: string) => {
        updatePlanTasks((prev: WeeklyPlanTask[]) =>
            prev.map((t: WeeklyPlanTask) => t.id === id ? { ...t, done: !t.done } : t)
        );
    }, [updatePlanTasks]);

    const handleDeletePlanTask = useCallback((id: string) => {
        updatePlanTasks((prev: WeeklyPlanTask[]) => prev.filter((t: WeeklyPlanTask) => t.id !== id));
    }, [updatePlanTasks]);

    const handleReorderPlanTasks = useCallback((draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        updatePlanTasks((prev: WeeklyPlanTask[]) => {
            const arr = [...prev];
            const fromIdx = arr.findIndex(t => t.id === draggedId);
            const toIdx = arr.findIndex(t => t.id === targetId);
            if (fromIdx === -1 || toIdx === -1) return prev;
            const [item] = arr.splice(fromIdx, 1);
            arr.splice(toIdx, 0, item);
            return arr;
        });
    }, [updatePlanTasks]);

    const behindCourses = useMemo(
        () => courses.filter((c: Course) => getStatus(c) === "behind"),
        [courses]
    );

    const sortedCourses = useMemo(
        () =>
            [...courses].sort((a: Course, b: Course) => {
                const aFocus = getCurrentFocus(a);
                const bFocus = getCurrentFocus(b);

                if (aFocus.type === "midterm" && bFocus.type === "final") return -1;
                if (aFocus.type === "final" && bFocus.type === "midterm") return 1;

                const aDate = aFocus.type === "midterm" ? aFocus.milestone!.date : a.examDate;
                const bDate = bFocus.type === "midterm" ? bFocus.milestone!.date : b.examDate;

                return getDaysUntil(aDate) - getDaysUntil(bDate);
            }),
        [courses]
    );

    const overallProgress = useMemo(() => {
        if (courses.length === 0) return 0;
        const total = courses.reduce((s: number, c: Course) => s + c.totalChapters, 0);
        const done = courses.reduce((s: number, c: Course) => s + (c.completedChapters || 0), 0);
        return total === 0 ? 0 : Math.round((done / total) * 100);
    }, [courses]);

    return {
        courses,
        planTasks,
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
        handleLogHours,
        handleToggleChapter,
        handleToggleDeliverable,
        handleAddDeliverable,
        handleDeleteDeliverable,
        handleAddPlanTask,
        handleUpdatePlanTask,
        handleTogglePlanTask,
        handleDeletePlanTask,
        handleReorderPlanTasks,
    };
}
