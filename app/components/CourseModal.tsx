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
    const [totalChapters, setTotalChapters] = useState(course?.totalChapters?.toString() || "");
    const [completedChapters, setCompletedChapters] = useState(
        course?.completedChapters?.toString() || "0"
    );

    const [midterms, setMidterms] = useState<Milestone[]>(course?.midterms || []);
    const [description, setDescription] = useState(course?.description || "");
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
        onSave({
            name: name.trim(),
            courseType,
            startDate,
            examDate,
            totalChapters: parseInt(totalChapters),
            completedChapters: parseInt(completedChapters) || 0,
            midterms: courseType === "current" ? midterms : undefined,
            description: description.trim() || undefined,
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
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                        />
                    </div>

                    {/* Notion Link */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Notion Page Link
                            <span className="text-zinc-600 text-xs ml-2">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.877.466L16.793.013c1.682-.14 2.101.093 2.801.606l3.876 2.707c.467.327.607.746.607 1.26v17.317c0 1.027-.373 1.635-1.682 1.728l-15.458.934c-.98.046-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.107C1.053 1.08 1.426.56 2.877.466z"/>
                                </svg>
                            </div>
                            <input
                                type="url"
                                value={notionLink}
                                onChange={(e) => setNotionLink(e.target.value)}
                                placeholder="https://notion.so/your-course-page"
                                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">Link to your Notion page with notes and resources</p>
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
