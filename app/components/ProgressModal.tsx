"use client";

import { useState } from "react";
import { Course } from "../types";
import { getCurrentFocus } from "../hooks/useCourses";

interface ProgressModalProps {
    course: Course;
    onSave: (progress: number, midtermDone?: boolean) => void;
    onClose: () => void;
}

export default function ProgressModal({ course, onSave, onClose }: ProgressModalProps) {
    const [progress, setProgress] = useState(course.completedChapters);
    const [midtermDone, setMidtermDone] = useState(course.midtermCompleted || false);
    const focus = getCurrentFocus(course);

    const progressPercent = (progress / course.totalChapters) * 100;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 rounded-3xl p-8 w-full max-w-sm border border-zinc-800 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">Update Progress</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-zinc-500 mb-6">{course.name}</p>

                <div className="mb-6">
                    {/* Counter */}
                    <div className="flex justify-between items-end mb-5">
                        <span className="text-6xl font-bold text-white tabular-nums">{progress}</span>
                        <span className="text-2xl text-zinc-500 mb-1">/ {course.totalChapters}</span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min="0"
                        max={course.totalChapters}
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                        className="w-full h-3 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-sm text-zinc-500 mt-2">
                        <span>0</span>
                        {focus === "midterm" && course.midtermChapters && (
                            <span className="text-amber-500/70">Midterm: {course.midtermChapters}</span>
                        )}
                        <span>{course.totalChapters}</span>
                    </div>
                </div>

                {/* Midterm checkbox */}
                {course.courseType === "current" && course.hasMidterm && !course.midtermCompleted && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-800/30">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={midtermDone}
                                onChange={(e) => setMidtermDone(e.target.checked)}
                                className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                            />
                            <span className="text-amber-200">I completed the midterm ✓</span>
                        </label>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(progress, midtermDone)}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
