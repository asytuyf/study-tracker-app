"use client";

import { useState, useEffect } from "react";
import { Course, CourseStatus } from "./types";

const COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-emerald-500",
  "from-indigo-500 to-purple-500",
  "from-rose-500 to-orange-500",
];

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDeliverablesModalOpen, setIsDeliverablesModalOpen] = useState(false); // New modal state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("examCoursesV3");
    if (saved) {
      setCourses(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("examCoursesV3", JSON.stringify(courses));
    }
  }, [courses, mounted]);

  // Calculate weeks since start (for current courses)
  const getWeeksSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
    return Math.max(0, Math.floor(diffWeeks));
  };

  // Calculate weeks until exam
  const getWeeksUntilExam = (examDate: string) => {
    const exam = new Date(examDate);
    const today = new Date();
    const diffTime = exam.getTime() - today.getTime();
    const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);
    return Math.max(0, Math.ceil(diffWeeks));
  };

  // Calculate days until a date
  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get current focus (midterm or final) - only for current courses
  const getCurrentFocus = (course: Course): "midterm" | "final" => {
    if (course.courseType !== "current") return "final";
    if (!course.hasMidterm || !course.midtermDate) return "final";
    if (course.midtermCompleted) return "final";

    const daysToMidterm = getDaysUntil(course.midtermDate);
    if (daysToMidterm < 0) return "final";
    return "midterm";
  };

  // Get expected chapter
  const getExpectedChapter = (course: Course) => {
    if (course.courseType === "current" && course.startDate) {
      // Current course: 1 chapter per week
      const weeks = getWeeksSinceStart(course.startDate);
      const focus = getCurrentFocus(course);

      if (focus === "midterm" && course.midtermChapters) {
        return Math.min(weeks, course.midtermChapters);
      }
      return Math.min(weeks, course.totalChapters);
    } else if (course.courseType === "self-study" && course.startDate) {
      // Self-study: Linear progress based on start date and exam date
      const start = new Date(course.startDate).getTime();
      const end = new Date(course.examDate).getTime();
      const now = new Date().getTime();
      
      if (now < start) return 0;
      if (now > end) return course.totalChapters;

      const totalDuration = end - start;
      const elapsed = now - start;
      const progressRatio = elapsed / totalDuration;
      
      return Math.round(progressRatio * course.totalChapters);
    } else {
      // Fallback if no start date (shouldn't happen with new courses)
      const weeksLeft = getWeeksUntilExam(course.examDate);
      const totalWeeksNeeded = Math.ceil(course.totalChapters); 
      const weeksPassed = totalWeeksNeeded - weeksLeft;
      return Math.max(0, Math.min(weeksPassed, course.totalChapters));
    }
  };

  // Get chapters per week needed (for self-study)
  const getChaptersPerWeek = (course: Course) => {
    const remaining = course.totalChapters - course.completedChapters;
    const weeksLeft = getWeeksUntilExam(course.examDate);
    if (weeksLeft <= 0) return remaining;
    return Math.round((remaining / weeksLeft) * 10) / 10;
  };

  // Get target chapters (for current focus)
  const getTargetChapters = (course: Course) => {
    if (course.courseType === "current") {
      const focus = getCurrentFocus(course);
      if (focus === "midterm" && course.midtermChapters) {
        return course.midtermChapters;
      }
    }
    return course.totalChapters;
  };

  // Get status
  const getStatus = (course: Course): CourseStatus => {
    const expected = getExpectedChapter(course);
    const diff = course.completedChapters - expected;
    
    if (diff >= 1) return "ahead";
    if (diff >= 0) return "on-track"; // 0 means exactly on track or slightly behind but rounded
    if (diff >= -1) return "on-track"; // Allow a small buffer
    return "behind";
  };

  // Get weeks/chapters behind
  const getBehindAmount = (course: Course) => {
    const expected = getExpectedChapter(course);
    return Math.max(0, expected - course.completedChapters);
  };

  const behindCourses = courses.filter((c) => getStatus(c) === "behind");

  // Sort: midterms first, then by urgency
  const sortedCourses = [...courses].sort((a, b) => {
    const aFocus = getCurrentFocus(a);
    const bFocus = getCurrentFocus(b);

    if (aFocus === "midterm" && bFocus === "final") return -1;
    if (aFocus === "final" && bFocus === "midterm") return 1;

    const aDate = aFocus === "midterm" ? a.midtermDate! : a.examDate;
    const bDate = bFocus === "midterm" ? b.midtermDate! : b.examDate;

    return getDaysUntil(aDate) - getDaysUntil(bDate);
  });

  const handleAddCourse = (data: Omit<Course, "id" | "color">) => {
    const newCourse: Course = {
      ...data,
      id: Date.now().toString(),
      color: COLORS[courses.length % COLORS.length],
    };
    setCourses([...courses, newCourse]);
    setIsModalOpen(false);
  };

  const handleEditCourse = (data: Omit<Course, "id" | "color">) => {
    if (!editingCourse) return;
    setCourses(
      courses.map((c) =>
        c.id === editingCourse.id ? { ...c, ...data } : c
      )
    );
    setEditingCourse(null);
    setIsModalOpen(false);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const handleToggleDeliverable = (courseId: string, deliverableId: string) => {
    setCourses(
      courses.map((c) => {
        if (c.id !== courseId) return c;
        const newDeliverables = c.deliverables?.map((d) =>
          d.id === deliverableId ? { ...d, completed: !d.completed } : d
        );
        return { ...c, deliverables: newDeliverables };
      })
    );
  };

  const handleAddDeliverable = (courseId: string, name: string) => {
    setCourses(
      courses.map((c) => {
        if (c.id !== courseId) return c;
        const newDeliverable = {
          id: Date.now().toString(),
          name,
          completed: false,
        };
        return { ...c, deliverables: [...(c.deliverables || []), newDeliverable] };
      })
    );
  };

  const handleDeleteDeliverable = (courseId: string, deliverableId: string) => {
    setCourses(
      courses.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          deliverables: c.deliverables?.filter((d) => d.id !== deliverableId),
        };
      })
    );
  };

  const handleUpdateProgress = (newProgress: number, midtermDone?: boolean) => {
    if (!selectedCourseId) return;
    setCourses(
      courses.map((c) =>
        c.id === selectedCourseId
          ? { ...c, completedChapters: newProgress, midtermCompleted: midtermDone ?? c.midtermCompleted }
          : c
      )
    );
    setSelectedCourseId(null);
    setIsProgressModalOpen(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#09090b]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Exam Tracker
          </h1>
          <p className="text-zinc-500 text-center mt-3 text-lg">
            Stay on track for your exams
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Quick Stats */}
        {courses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Semester</p>
              <p className="text-3xl font-bold text-blue-400">
                {courses.filter(c => c.courseType === "current").length}
              </p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Flexible</p>
              <p className="text-3xl font-bold text-purple-400">
                {courses.filter(c => c.courseType === "self-study").length}
              </p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Behind</p>
              <p className={`text-3xl font-bold ${behindCourses.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {behindCourses.length}
              </p>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {courses.length > 0 && (
          <div
            className={`rounded-2xl p-5 mb-8 animate-fade-in ${
              behindCourses.length > 0
                ? "bg-gradient-to-r from-red-950/50 to-red-900/30 border border-red-800/50"
                : "bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 border border-emerald-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  behindCourses.length > 0 ? "bg-red-500/20" : "bg-emerald-500/20"
                }`}
              >
                {behindCourses.length > 0 ? "⚠️" : "✓"}
              </div>
              <div>
                <p className={`font-semibold ${behindCourses.length > 0 ? "text-red-200" : "text-emerald-200"}`}>
                  {behindCourses.length > 0
                    ? `Behind on ${behindCourses.length} course${behindCourses.length > 1 ? "s" : ""}`
                    : "You're on track!"}
                </p>
                <p className="text-sm text-zinc-400">
                  {behindCourses.length > 0
                    ? behindCourses.map((c) => c.name).join(", ")
                    : "Keep up the good work"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Course Button */}
        <button
          onClick={() => {
            setEditingCourse(null);
            setIsModalOpen(true);
          }}
          className="w-full p-5 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 transition-all duration-300 mb-8 group"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add Course</span>
          </div>
        </button>

        {/* Course Cards */}
        <div className="space-y-4">
          {sortedCourses.map((course, index) => {
            const status = getStatus(course);
            const focus = getCurrentFocus(course);
            const behind = getBehindAmount(course);
            const target = getTargetChapters(course);

            const isCurrent = course.courseType === "current";
            const weeksIn = isCurrent && course.startDate ? getWeeksSinceStart(course.startDate) : null;
            
            const relevantDate = focus === "midterm" ? course.midtermDate! : course.examDate;
            const daysLeft = getDaysUntil(relevantDate);

            const progressPercent = (course.completedChapters / target) * 100;
            const expected = getExpectedChapter(course);
            const expectedPercent = expected !== null ? (expected / target) * 100 : null;

            return (
              <div
                key={course.id}
                className={`glass rounded-2xl p-6 animate-fade-in hover:bg-white/[0.04] transition-all duration-300 ${
                  focus === "midterm" ? "ring-2 ring-amber-500/30" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Type & Focus Badges */}
                <div className="flex justify-between mb-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    isCurrent
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  }`}>
                    {isCurrent ? "📅 Semester" : "⚡ Flexible"}
                  </span>

                  {focus === "midterm" && (
                    <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                      📝 MIDTERM FOCUS
                    </span>
                  )}
                </div>

                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                      {course.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{course.name}</h3>
                      <p className="text-sm text-zinc-500">
                        {isCurrent && weeksIn !== null ? `Week ${weeksIn} • ` : ""}
                        {daysLeft > 0 ? `${daysLeft} days to ${focus}` : `${focus} passed`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      status === "ahead"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : status === "on-track"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {status === "ahead" ? "↑ Ahead" : status === "on-track" ? "✓ On Track" : `↓ Behind`}
                  </span>
                </div>

                {/* Stats - Unified for both */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white">
                      {course.completedChapters}
                      <span className="text-zinc-500 text-lg">/{target}</span>
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Should be</p>
                    <p className={`text-2xl font-bold ${status === "behind" ? "text-red-400" : "text-emerald-400"}`}>
                      {expected !== null ? expected : "-"}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      {focus === "midterm" ? "Midterm" : "Final"}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {daysLeft}d <span className="text-xs text-zinc-500">left</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">
                      Progress
                    </span>
                    <span className="text-zinc-300 font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === "ahead"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                          : status === "on-track"
                          ? "bg-gradient-to-r from-emerald-500 to-green-400"
                          : "bg-gradient-to-r from-red-500 to-orange-400"
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                    {/* Expected marker - for ALL courses now */}
                    {expectedPercent !== null && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full shadow-lg"
                        style={{ left: `${Math.min(expectedPercent, 100)}%` }}
                        title={`Should be at chapter ${expected}`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">
                    White line = where you should be ({expected})
                  </p>
                </div>

                {/* Behind Warning */}
                {status === "behind" && (
                  <div className="mb-4 p-4 rounded-xl bg-red-950/30 border border-red-800/30">
                    <p className="text-red-300 text-sm">
                        <>⚠️ You need to complete <strong>{behind} extra chapter{behind > 1 ? "s" : ""}</strong> to catch up.</>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                   {/* Task Summary if any */}
                   {(course.deliverables?.length || 0) > 0 && (
                    <div 
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setIsDeliverablesModalOpen(true);
                      }}
                      className="cursor-pointer bg-black/20 rounded-xl p-3 mb-2 hover:bg-black/30 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assignments / Sheets</span>
                        <span className="text-xs text-zinc-500">
                          {course.deliverables?.filter(d => d.completed).length}/{course.deliverables?.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {course.deliverables?.slice(0, 2).map(d => (
                          <div key={d.id} className="flex items-center gap-2 text-sm text-zinc-300">
                             <div className={`w-2 h-2 rounded-full ${d.completed ? "bg-emerald-500" : "bg-zinc-600"}`} />
                             <span className={d.completed ? "line-through opacity-50" : ""}>{d.name}</span>
                          </div>
                        ))}
                        {(course.deliverables?.length || 0) > 2 && (
                          <p className="text-xs text-zinc-500 pl-4">+ {(course.deliverables?.length || 0) - 2} more</p>
                        )}
                      </div>
                    </div>
                   )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setIsProgressModalOpen(true);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                        status === "behind"
                          ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                      }`}
                    >
                      Update
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setIsDeliverablesModalOpen(true);
                      }}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Manage Tasks/Sheets"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setIsModalOpen(true);
                      }}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this course?")) {
                          handleDeleteCourse(course.id);
                        }
                      }}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-red-900/50 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No courses yet</h3>
            <p className="text-zinc-500 mb-6">Add your courses to start tracking</p>
          </div>
        )}
      </div>

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <CourseModal
          course={editingCourse}
          onSave={editingCourse ? handleEditCourse : handleAddCourse}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
        />
      )}

      {/* Update Progress Modal */}
      {isProgressModalOpen && selectedCourseId && (
        <ProgressModal
          course={courses.find((c) => c.id === selectedCourseId)!}
          onSave={handleUpdateProgress}
          onClose={() => {
            setIsProgressModalOpen(false);
            setSelectedCourseId(null);
          }}
        />
      )}

      {/* Deliverables/Tasks Modal */}
      {isDeliverablesModalOpen && selectedCourseId && (
        <DeliverablesModal
          course={courses.find((c) => c.id === selectedCourseId)!}
          onToggle={(taskId) => handleToggleDeliverable(selectedCourseId, taskId)}
          onAdd={(name) => handleAddDeliverable(selectedCourseId, name)}
          onDelete={(taskId) => handleDeleteDeliverable(selectedCourseId, taskId)}
          onClose={() => {
            setIsDeliverablesModalOpen(false);
            setSelectedCourseId(null);
          }}
        />
      )}
    </div>
  );
}

function CourseModal({
  course,
  onSave,
  onClose,
}: {
  course: Course | null;
  onSave: (data: Omit<Course, "id" | "color">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(course?.name || "");
  const [courseType, setCourseType] = useState<"current" | "self-study">(course?.courseType || "current");
  const [startDate, setStartDate] = useState(course?.startDate || "");
  const [examDate, setExamDate] = useState(course?.examDate || "");
  const [totalChapters, setTotalChapters] = useState(course?.totalChapters?.toString() || "");
  const [completedChapters, setCompletedChapters] = useState(course?.completedChapters?.toString() || "0");

  const [hasMidterm, setHasMidterm] = useState(course?.hasMidterm || false);
  const [midtermDate, setMidtermDate] = useState(course?.midtermDate || "");
  const [midtermChapters, setMidtermChapters] = useState(course?.midtermChapters?.toString() || "");
  const [midtermCompleted, setMidtermCompleted] = useState(course?.midtermCompleted || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      courseType,
      startDate,
      examDate,
      totalChapters: parseInt(totalChapters),
      completedChapters: parseInt(completedChapters),
      hasMidterm: courseType === "current" ? hasMidterm : false,
      midtermDate: courseType === "current" && hasMidterm ? midtermDate : undefined,
      midtermChapters: courseType === "current" && hasMidterm ? parseInt(midtermChapters) : undefined,
      midtermCompleted: courseType === "current" ? midtermCompleted : false,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-zinc-900 rounded-3xl p-8 w-full max-w-md border border-zinc-800 animate-fade-in my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">
          {course ? "Edit Course" : "Add Course"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Course Type Toggle */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Course Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourseType("current")}
                className={`p-4 rounded-xl border text-center transition-all ${
                  courseType === "current"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                }`}
              >
                <p className="font-medium">📅 Semester</p>
                <p className="text-xs opacity-70 mt-1">Fixed dates</p>
              </button>
              <button
                type="button"
                onClick={() => setCourseType("self-study")}
                className={`p-4 rounded-xl border text-center transition-all ${
                  courseType === "self-study"
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                }`}
              >
                <p className="font-medium">⚡ Flexible</p>
                <p className="text-xs opacity-70 mt-1">Own pace</p>
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm text-zinc-400 mb-2">Completed</label>
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

          {/* Midterm Section - Only for current courses */}
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <span className="text-zinc-300">Midterm completed</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              {course ? "Save" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressModal({
  course,
  onSave,
  onClose,
}: {
  course: Course;
  onSave: (progress: number, midtermDone?: boolean) => void;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(course.completedChapters);
  const [midtermDone, setMidtermDone] = useState(course.midtermCompleted || false);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-3xl p-8 w-full max-w-sm border border-zinc-800 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-2">Update Progress</h2>
        <p className="text-zinc-500 mb-6">{course.name}</p>

        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <span className="text-5xl font-bold text-white">{progress}</span>
            <span className="text-2xl text-zinc-500">/ {course.totalChapters}</span>
          </div>

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
              <span className="text-amber-200">I completed the midterm</span>
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

function DeliverablesModal({
  course,
  onToggle,
  onAdd,
  onDelete,
  onClose,
}: {
  course: Course;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newTask, setNewTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAdd(newTask.trim());
    setNewTask("");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-3xl p-8 w-full max-w-md border border-zinc-800 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Assignments & Sheets</h2>
            <p className="text-zinc-500">{course.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2">
          {(!course.deliverables || course.deliverables.length === 0) && (
            <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
              <p>No assignments added yet</p>
            </div>
          )}
          
          {course.deliverables?.map((task) => (
            <div key={task.id} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-xl group hover:bg-zinc-800 transition-colors">
              <button
                onClick={() => onToggle(task.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-zinc-600 hover:border-zinc-400"
                }`}
              >
                {task.completed && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-zinc-200 ${task.completed ? "line-through opacity-50" : ""}`}>
                {task.name}
              </span>
              <button 
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add new sheet / problem set..."
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}