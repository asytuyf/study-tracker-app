"use client";

import { useCourses } from "../hooks/useCourses";
import WeeklyAnalysis from "../components/WeeklyAnalysis";
import BubbleCluster from "../components/BubbleCluster";
import Link from "next/link";

export default function WeeklyAnalysisPage() {
    const { courses, mounted } = useCourses();

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-[#09090b] relative">
            <div className="circuit-background" />

            <BubbleCluster side="left" />
            <BubbleCluster side="right" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 mb-4 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
                        </Link>
                        <h1 className="text-5xl font-black text-white tracking-tight">
                            Weekly<span className="text-blue-500">Analysis</span>
                        </h1>
                    </div>
                </div>

                <div className="space-y-12">
                    <section>
                        <WeeklyAnalysis courses={courses} />
                    </section>

                    {/* Detailed Breakdown could go here */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {courses.filter(c => c.itemType === "project" || (c.weeklyHourGoal && c.weeklyHourGoal > 0)).map(course => (
                            <div key={course.id} className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                                <h3 className="text-xl font-bold text-white mb-4">{course.name}</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500 uppercase tracking-widest font-bold">Goal</span>
                                        <span className="text-white font-black">{course.weeklyHourGoal || 0}h / week</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500 uppercase tracking-widest font-bold">Log History</span>
                                        <span className="text-zinc-400">{(course.weeklyLogs || []).length} entries</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
