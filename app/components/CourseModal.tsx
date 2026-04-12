"use client";

import { useState } from "react";
import { Course, Milestone } from "../types";

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
    const [itemType, setItemType] = useState<"course" | "project">(
        course?.itemType || "course"
    );
    const [totalChapters, setTotalChapters] = useState(course?.totalChapters?.toString() || "");
    const [completedChapters, setCompletedChapters] = useState(
        course?.completedChapters?.toString() || "0"
    );
    const [weeklyHourGoal, setWeeklyHourGoal] = useState(
        course?.weeklyHourGoal?.toString() || "10"
    );
    const [chapterScheduleJson, setChapterScheduleJson] = useState(
        course?.chapterSchedule ? JSON.stringify(course.chapterSchedule, null, 2) : ""
    );

    const [midterms, setMidterms] = useState<Milestone[]>(course?.midterms || []);
    const [description, setDescription] = useState(course?.description || "");
    const [notebookLMLink, setNotebookLMLink] = useState(course?.notebookLMLink || "");
    const [notionLink, setNotionLink] = useState(course?.notionLink || "");

    const handleAddMidterm = () => {
        const newMidterm: Milestone = {
            id: crypto.randomUUID(),
            name: `Midterm ${midterms.length + 1}`,
            date: "",
            chapters: 0,
            completed: false,
        };
        setMidterms([...midterms, newMidterm]);
    };

    const handleUpdateMidterm = (id: string, updates: Partial<Milestone>) => {
        setMidterms(midterms.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const handleRemoveMidterm = (id: string) => {
        setMidterms(midterms.filter(m => m.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let chapterSchedule;
        try {
            chapterSchedule = chapterScheduleJson ? JSON.parse(chapterScheduleJson) : undefined;
        } catch (e) {
            alert("Invalid JSON for Chapter Schedule. Please check the format.");
            return;
        }

        onSave({
            name: name.trim(),
            itemType,
            courseType,
            startDate,
            examDate,
            totalChapters: parseInt(totalChapters) || 0,
            completedChapters: parseInt(completedChapters) || 0,
            weeklyHourGoal: itemType === "project" ? parseInt(weeklyHourGoal) : undefined,
            chapterSchedule,
            midterms: courseType === "current" ? midterms : undefined,
            description: description.trim() || undefined,
            notebookLMLink: notebookLMLink.trim() || undefined,
            notionLink: notionLink.trim() || undefined,
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
                            className="w-full px-3 sm:px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                            required
                        />
                    </div>

                    {/* Item type */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Item Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setItemType("course")}
                                className={`p-4 rounded-xl border text-center transition-all ${itemType === "course"
                                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">📚 Course</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setItemType("project")}
                                className={`p-4 rounded-xl border text-center transition-all ${itemType === "project"
                                    ? "border-amber-500 bg-amber-500/20 text-amber-300"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">🏗️ Project</p>
                            </button>
                        </div>
                    </div>

                    {/* Course type */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Category</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setCourseType("current")}
                                className={`p-4 rounded-xl border text-center transition-all ${courseType === "current"
                                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">📅 Semester</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCourseType("self-study")}
                                className={`p-4 rounded-xl border text-center transition-all ${courseType === "self-study"
                                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                    }`}
                            >
                                <p className="font-medium">⚡ Flexible</p>
                            </button>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                {courseType === "current" ? "Semester Start" : "Start Date"}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
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
                                className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                                required
                            />
                        </div>
                    </div>

                    {/* Chapters */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Total Chapters</label>
                            <input
                                type="number"
                                value={totalChapters}
                                onChange={(e) => setTotalChapters(e.target.value)}
                                placeholder="e.g., 12"
                                min="1"
                                className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Completed</label>
                            <input
                                type="number"
                                value={completedChapters}
                                onChange={(e) => setCompletedChapters(e.target.value)}
                                min="0"
                                className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Weekly Hour Goal (Project only) */}
                    {itemType === "project" && (
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Weekly Hour Goal</label>
                            <input
                                type="number"
                                value={weeklyHourGoal}
                                onChange={(e) => setWeeklyHourGoal(e.target.value)}
                                placeholder="e.g., 10"
                                min="1"
                                className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                                required
                            />
                        </div>
                    )}

                    {/* Chapter Schedule JSON */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Chapter Schedule (JSON)
                            <span className="text-zinc-600 text-[10px] ml-2 tracking-tight">[{'{"week": 1, "chapters": [1, 2]}', ...}]</span>
                        </label>
                        <textarea
                            value={chapterScheduleJson}
                            onChange={(e) => setChapterScheduleJson(e.target.value)}
                            placeholder='[{"week": 1, "chapters": [1, 2]}]'
                            className="w-full px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 font-mono resize-none"
                        />
                    </div>

                    {/* Midterm section — current courses only */}
                    {courseType === "current" && (
                        <div className="border-t border-zinc-800 pt-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-white font-medium">Midterm Milestones</label>
                                <button
                                    type="button"
                                    onClick={handleAddMidterm}
                                    className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-all"
                                >
                                    + ADD MIDTERM
                                </button>
                            </div>

                            {midterms.length === 0 && (
                                <p className="text-xs text-zinc-500 italic">No midterms added for this course.</p>
                            )}

                            <div className="space-y-3">
                                {midterms.map((midterm, index) => (
                                    <div key={midterm.id} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-3 relative group/midterm">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMidterm(midterm.id)}
                                            className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover/midterm:opacity-100 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={midterm.name}
                                                    onChange={(e) => handleUpdateMidterm(midterm.id, { name: e.target.value })}
                                                    placeholder="Midterm Name"
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 uppercase font-black mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={midterm.date}
                                                    onChange={(e) => handleUpdateMidterm(midterm.id, { date: e.target.value })}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-zinc-500 uppercase font-black mb-1">Chapters</label>
                                                <input
                                                    type="number"
                                                    value={midterm.chapters}
                                                    onChange={(e) => handleUpdateMidterm(midterm.id, { chapters: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description / Notes */}
                    <div className="border-t border-zinc-800 pt-5">
                        <label className="block text-sm text-zinc-400 mb-2">Description / Exam Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Open book, focus on chapter 4, etc."
                            className="w-full px-3 sm:px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none text-sm sm:text-base"
                        />
                    </div>

                    {/* Links Section */}
                    <div className="space-y-4">
                        {/* NotebookLM Link */}
                        <div className="overflow-hidden">
                            <label className="block text-sm text-zinc-400 mb-2">
                                NotebookLM Link
                                <span className="text-zinc-600 text-xs ml-2">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 3L14.5 8.5L20 9.5L16 14L17 20L12 17L7 20L8 14L4 9.5L9.5 8.5L12 3Z" fill="url(#sparkle-input)" />
                                        <defs>
                                            <linearGradient id="sparkle-input" x1="4" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                                                <stop stopColor="#EC4899" />
                                                <stop offset="0.5" stopColor="#A855F7" />
                                                <stop offset="1" stopColor="#3B82F6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                <input
                                    type="url"
                                    value={notebookLMLink}
                                    onChange={(e) => setNotebookLMLink(e.target.value)}
                                    placeholder="notebooklm.google.com/..."
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                />
                            </div>
                        </div>

                        {/* Notion Link */}
                        <div className="overflow-hidden">
                            <label className="block text-sm text-zinc-400 mb-2">
                                Notion Link
                                <span className="text-zinc-600 text-xs ml-2">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded flex items-center justify-center">
                                    <svg className="w-3 h-3" viewBox="0 0 100 100" fill="none">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000" />
                                    </svg>
                                </div>
                                <input
                                    type="url"
                                    value={notionLink}
                                    onChange={(e) => setNotionLink(e.target.value)}
                                    placeholder="notion.so/..."
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors text-sm"
                                />
                            </div>
                        </div>
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
