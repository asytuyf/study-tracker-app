"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Course } from "./types";
import { useCourses, SaveStatus, getDaysUntil } from "./hooks/useCourses";
import CourseCard from "./components/CourseCard";
import CourseModal from "./components/CourseModal";
import ProgressModal from "./components/ProgressModal";
import DeliverablesModal from "./components/DeliverablesModal";
import BubbleCluster from "./components/BubbleCluster";
import AdminButton from "./components/AdminButton";
import WeeklyAnalysis from "./components/WeeklyAnalysis";
import Link from "next/link";

// Today's date formatted nicely
function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getCurrentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

// Save status indicator component
function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saved") {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        Synced
      </div>
    );
  }
  if (status === "saving") {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        Saving...
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-widest uppercase">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        Pending
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest uppercase">
      <div className="w-2 h-2 rounded-full bg-red-400" />
      Error
    </div>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "addEdit"; course: Course | null }
  | { type: "progress"; courseId: string }
  | { type: "tasks"; courseId: string };

export default function Home() {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const {
    courses,
    planTasks,
    mounted,
    saveStatus,
    sortedCourses,
    handleAddCourse,
    handleEditCourse,
    handleDeleteCourse,
    handleUpdateProgress,
    handleQuickUpdate,
    handleToggleDeliverable,
    handleAddDeliverable,
    handleDeleteDeliverable,
    handleToggleChapter,
    handleLogHours,
  } = useCourses();

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const closeModal = useCallback(() => setModal({ type: "none" }), []);
  const openAdd = useCallback(() => setModal({ type: "addEdit", course: null }), []);
  const openEdit = useCallback((course: Course) => setModal({ type: "addEdit", course }), []);
  const openProgress = useCallback((courseId: string) => setModal({ type: "progress", courseId }), []);
  const openTasks = useCallback((courseId: string) => setModal({ type: "tasks", courseId }), []);

  // Current week for plan task count
  const currentWeek = useMemo(() => getCurrentWeekMonday(), []);
  const weekTasksDone = useMemo(() =>
    planTasks.filter(t => t.weekDate === currentWeek && t.done).length, [planTasks, currentWeek]);
  const weekTasksTotal = useMemo(() =>
    planTasks.filter(t => t.weekDate === currentWeek).length, [planTasks, currentWeek]);

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

      <div className="relative z-10">
        {/* ── Header ── */}
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="text-xs text-blue-400/60 font-black uppercase tracking-[0.3em] mb-4">
            {getTodayLabel()}
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Study<span className="text-blue-500">Tracker</span>
          </h1>
          <div className="h-1.5 w-12 bg-blue-500 mx-auto mt-6 rounded-full" />

          {/* Save status */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {isAdmin && <SaveIndicator status={saveStatus} />}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6">

          {/* ── Courses ── */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Courses & Projects</h2>
              <p className="text-zinc-600 text-sm mt-0.5">Your active academic deck</p>
            </div>
          </div>

          {/* Course cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {sortedCourses.map((course, index) => (
              <div key={course.id}>
                <CourseCard
                  course={course}
                  index={index}
                  onUpdate={isAdmin ? () => openProgress(course.id) : undefined}
                  onTasks={() => openTasks(course.id)}
                  onEdit={isAdmin ? () => openEdit(course) : undefined}
                  onDelete={isAdmin ? () => {
                    if (confirm(`Delete "${course.name}"? This can't be undone.`)) {
                      handleDeleteCourse(course.id);
                    }
                  } : undefined}
                  onQuickUpdate={isAdmin ? (delta) => handleQuickUpdate(course.id, delta) : undefined}
                  onToggleChapter={handleToggleChapter}
                  onLogHours={(id, hours) => {
                    handleLogHours(id, getCurrentWeekMonday(), hours);
                  }}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>

          {/* Admin add button — only when logged in */}
          {isAdmin && (
            <div className="mb-3">
              <AdminButton onAddCourse={openAdd} />
            </div>
          )}

          {/* Empty state */}
          {courses.length === 0 && (
            <div className="text-center py-16 animate-fade-in rounded-3xl border border-dashed border-white/10 mb-10">
              <h3 className="text-xl font-black text-white mb-2 italic uppercase">Ready to start?</h3>
              <p className="text-zinc-500 text-sm">
                {isAdmin ? "Add your first course or project above." : "Sign in to populate your dashboard."}
              </p>
            </div>
          )}

          {/* ── Separator ── */}
          <div className="flex items-center gap-4 my-12">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Overview</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* ── Dashboard Overview ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {/* Weekly Plan card */}
            <Link href="/plan" className="group p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 group-hover:text-blue-400 transition-colors">This Week</p>
              <p className="text-4xl font-black text-white mb-1">
                {weekTasksDone}<span className="text-zinc-500 text-xl font-bold">/{weekTasksTotal}</span>
              </p>
              <p className="text-xs text-zinc-500 mb-4">tasks complete</p>
              {weekTasksTotal > 0 && (
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${(weekTasksDone / weekTasksTotal) * 100}%` }}
                  />
                </div>
              )}
              <p className="text-[10px] text-blue-500 font-bold mt-3">Open plan →</p>
            </Link>

            {/* Courses count */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Courses</p>
              <p className="text-4xl font-black text-white mb-1">
                {courses.filter((c: Course) => c.itemType !== "project").length}
              </p>
              <p className="text-xs text-zinc-500">being tracked</p>
              <div className="mt-4">
                <span className="text-xs text-zinc-600">
                  {courses.filter((c: Course) => c.itemType === "project").length} project{courses.filter((c: Course) => c.itemType === "project").length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly hours analysis */}
          <WeeklyAnalysis courses={courses} />
        </div>

        {/* Modals */}
        {modal.type === "addEdit" && (
          <CourseModal
            course={modal.course}
            onSave={(data) => {
              if (modal.course) {
                handleEditCourse(modal.course.id, data);
              } else {
                handleAddCourse(data);
              }
              closeModal();
            }}
            onClose={closeModal}
          />
        )}

        {modal.type === "progress" && (() => {
          const course = courses.find((c) => c.id === modal.courseId);
          if (!course) return null;
          return (
            <ProgressModal
              course={course}
              onSave={(progress, milestoneId, milestoneDone) => {
                handleUpdateProgress(modal.courseId, progress, milestoneId, milestoneDone);
                closeModal();
              }}
              onClose={closeModal}
            />
          );
        })()}

        {modal.type === "tasks" && (() => {
          const course = courses.find((c) => c.id === modal.courseId);
          if (!course) return null;
          return (
            <DeliverablesModal
              course={course}
              onToggle={isAdmin ? (id) => handleToggleDeliverable(modal.courseId, id) : () => { }}
              onAdd={isAdmin ? (name, dueDate, category) => handleAddDeliverable(modal.courseId, name, dueDate, category) : () => { }}
              onDelete={isAdmin ? (id) => handleDeleteDeliverable(modal.courseId, id) : () => { }}
              onClose={closeModal}
              isAdmin={isAdmin}
            />
          );
        })()}
      </div>

      {/* Footer: sign in / out */}
      <div className="max-w-4xl mx-auto px-6 pb-10 flex justify-center">
        {session ? (
          <button
            onClick={() => signOut()}
            className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors font-medium"
          >
            Sign out ({session.user?.name || session.user?.email})
          </button>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors font-medium"
          >
            Admin sign in
          </button>
        )}
      </div>
    </div>
  );
}
