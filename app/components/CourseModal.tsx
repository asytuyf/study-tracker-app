"use client";

import { useState } from "react";
import { Course } from "../types";

interface CourseModalProps {
    course: Course | null;
    onSave: (data: Omit<Course, "id" | "color">) => void;
    onClose: () => void;
}

export default function CourseModal({ course, onSave, onClose }: CourseModalProps) {
    const [name, setName] = useState(course?.name || "");
    const [courseType, setCourseType] = useState<"current" | "self-study">(
        course?.courseType || "current"
    );
    const [startDate, setStartDate] = useState(course?.startDate || "");
    const [examDate, setExamDate] = useState(course?.examDate || "");
    const [totalChapters, setTotalChapters] = useState(course?.totalChapters?.toString() || "");
    const [completedChapters, setCompletedChapters] = useState(
        course?.completedChapters?.toString() || "0"
    );

    const [hasMidterm, setHasMidterm] = useState(course?.hasMidterm || false);
    const [midtermDate, setMidtermDate] = useState(course?.midtermDate || "");
    const [midtermChapters, setMidtermChapters] = useState(
        course?.midtermChapters?.toString() || ""
    );
    const [midtermCompleted, setMidtermCompleted] = useState(course?.midtermCompleted || false);
    const [description, setDescription] = useState(course?.description || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: name.trim(),
            courseType,
            startDate,
            examDate,
            totalChapters: parseInt(totalChapters),
            completedChapters: parseInt(completedChapters) || 0,
            hasMidterm: courseType === "current" ? hasMidterm : false,
            midtermDate: courseType === "current" && hasMidterm ? midtermDate : undefined,
            midtermChapters:
                courseType === "current" && hasMidterm ? parseInt(midtermChapters) || undefined : undefined,
            midtermCompleted: courseType === "current" ? midtermCompleted : false,
            description: description.trim() || undefined,
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 rounded-3xl p-4 sm:p-6 w-full max-w-md border border-zinc-800 animate-fade-in my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {course ? "Edit Course" : "Add Course"}
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Course name */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Course Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Linear Algebra"
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Course type */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Course Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setCourseType("current")}
                                className={`p-4 rounded-xl border text-center transition-all ${courseType === "current"
                                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">📅 Semester</p>
                                <p className="text-xs opacity-70 mt-1">Fixed lecture schedule</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCourseType("self-study")}
                                className={`p-4 rounded-xl border text-center transition-all ${courseType === "self-study"
                                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">⚡ Flexible</p>
                                <p className="text-xs opacity-70 mt-1">Study at own pace</p>
                            </button>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                {courseType === "current" ? "Semester Start" : "Start Date"}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                {courseType === "current" ? "Final Exam" : "Target Date"}
                            </label>
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Chapters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Total Chapters</label>
                            <input
                                type="number"
                                value={totalChapters}
                                onChange={(e) => setTotalChapters(e.target.value)}
                                placeholder="e.g., 12"
                                min="1"
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Completed So Far</label>
                            <input
                                type="number"
                                value={completedChapters}
                                onChange={(e) => setCompletedChapters(e.target.value)}
                                min="0"
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Midterm section — current courses only */}
                    {courseType === "current" && (
                        <div className="border-t border-zinc-800 pt-5">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasMidterm}
                                    onChange={(e) => setHasMidterm(e.target.checked)}
                                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-white font-medium">This course has a midterm</span>
                            </label>

                            {hasMidterm && (
                                <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-amber-300/80 mb-2">Midterm Date</label>
                                            <input
                                                type="date"
                                                value={midtermDate}
                                                onChange={(e) => setMidtermDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-zinc-800 border border-amber-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
                                                required={hasMidterm}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-amber-300/80 mb-2">Chapters Covered</label>
                                            <input
                                                type="number"
                                                value={midtermChapters}
                                                onChange={(e) => setMidtermChapters(e.target.value)}
                                                placeholder="e.g., 6"
                                                min="1"
                                                className="w-full px-4 py-3 bg-zinc-800 border border-amber-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                                                required={hasMidterm}
                                            />
                                        </div>
                                    </div>

                                    {course && (
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={midtermCompleted}
                                                onChange={(e) => setMidtermCompleted(e.target.checked)}
                                                className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                                            />
                                            <span className="text-zinc-300">Midterm already completed</span>
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description / Notes */}
                    <div className="border-t border-zinc-800 pt-5">
                        <label className="block text-sm text-zinc-400 mb-2">Description / Exam Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Open book, focus on chapter 4, etc."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all"
                        >
                            {course ? "Save Changes" : "Add Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
