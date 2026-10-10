"use client";

import { useState } from "react";
import { Course } from "../types";

interface ArchivedCoursesProps {
    courses: Course[];
    onRestore?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export default function ArchivedCourses({ courses, onRestore, onDelete }: ArchivedCoursesProps) {
    const [open, setOpen] = useState(false);

    if (courses.length === 0) return null;

    return (
        <div className="mt-8 mb-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 py-2 group"
            >
                <svg
                    className={`w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    Archive · {courses.length}
                </span>
                <div className="flex-1 h-px bg-white/5" />
            </button>

            {open && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-fade-in">
                    {courses.map((course) => {
                        const isProject = course.itemType === "project";
                        const date = new Date(course.examDate);
                        const dateLabel = isNaN(date.getTime())
                            ? ""
                            : date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

                        return (
                            <div
                                key={course.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                            >
                                <div
                                    className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center text-sm font-bold text-white opacity-40 grayscale`}
                                >
                                    {course.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-zinc-400 truncate leading-tight">{course.name}</p>
                                    <p className="text-[10px] text-zinc-600 truncate">
                                        {isProject
                                            ? "Project"
                                            : `${course.completedChapters}/${course.totalChapters} ${course.unitName ? course.unitName.toLowerCase() + "s" : "chapters"}`}
                                        {dateLabel && ` · ${isProject ? "Deadline" : "Final"} ${dateLabel}`}
                                    </p>
                                </div>
                                {onRestore && (
                                    <button
                                        onClick={() => onRestore(course.id)}
                                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-white/5 hover:border-blue-500/20 transition-all"
                                    >
                                        Restore
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(course.id)}
                                        title="Delete permanently"
                                        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
