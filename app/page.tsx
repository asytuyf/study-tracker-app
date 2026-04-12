"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Course } from "./types";
import { useCourses, SaveStatus } from "./hooks/useCourses";
import CourseCard from "./components/CourseCard";
import CourseModal from "./components/CourseModal";
import ProgressModal from "./components/ProgressModal";
import DeliverablesModal from "./components/DeliverablesModal";
import BubbleCluster from "./components/BubbleCluster";
import AdminButton from "./components/AdminButton";
import CurrentPlan from "./components/CurrentPlan";
import WeeklyAnalysis from "./components/WeeklyAnalysis";
import styled from "styled-components";

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* Simple popup effect on hover - works in all browsers */
  .card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
  }

  .card:hover {
    transform: scale(1.02);
    z-index: 10;
  }

  &:hover .card:not(:hover) {
    opacity: 0.7;
    transform: scale(0.98);
  }
`;

// Today's date formatted nicely
function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
  // error
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
  const [isDevAdminEnabled, setIsDevAdminEnabled] = useState(true);

  // Admin logic: true if session exists OR (in dev mode AND toggle is on)
  const isAdmin = !!session || (process.env.NODE_ENV === "development" && isDevAdminEnabled);

  const {
    courses,
    mounted,
    saveStatus,
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
    handleToggleChapter,
    handleLogHours,
  } = useCourses();

  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const closeModal = useCallback(() => setModal({ type: "none" }), []);

  const openAdd = useCallback(() => setModal({ type: "addEdit", course: null }), []);
  const openEdit = useCallback(
    (course: Course) => setModal({ type: "addEdit", course }),
    []
  );
  const openProgress = useCallback(
    (courseId: string) => setModal({ type: "progress", courseId }),
    []
  );
  const openTasks = useCallback(
    (courseId: string) => setModal({ type: "tasks", courseId }),
    []
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const currentCount = courses.filter((c) => c.courseType === "current").length;
  const flexCount = courses.filter((c) => c.courseType === "self-study").length;

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

          {/* Save status indicator & Dev Admin Toggle */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {isAdmin && <SaveIndicator status={saveStatus} />}

            {process.env.NODE_ENV === "development" && !session && (
              <button
                onClick={() => setIsDevAdminEnabled(!isDevAdminEnabled)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border backdrop-blur-md ${isDevAdminEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}
              >
                Admin Mode: {isDevAdminEnabled ? "Active" : "Disabled"}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          {/* 1. CURRENT FOCUS / PLAN WIDGET */}
          <div className="mb-12">
            <CurrentPlan
              courses={courses}
              onEditCourse={(c: Course) => {
                setModal({ type: "addEdit", course: c });
              }}
            />
          </div>

          {/* 2. STATS OVERVIEW & WEEKLY ANALYSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1 space-y-8">
              {/* Summary Card */}
              <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-500" />
                <h2 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-6">Overview</h2>
                <div className="grid gap-6">
                  <div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-1">{courses.length}</p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Items</p>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div>
                    <p className="text-4xl font-black text-blue-400 tracking-tighter mb-1">
                      {courses.filter(c => c.itemType === "project").length}
                    </p>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Projects</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <WeeklyAnalysis courses={courses} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">My Deck</h2>
              <p className="text-zinc-500 font-medium">Track your academic progress and project milestones.</p>
            </div>
          </div>

          {/* Course cards grid with hover-blur effect */}
          <CardsGrid>
            {sortedCourses.map((course, index) => (
              <div className="card" key={course.id}>
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
                    const d = new Date();
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(d.setDate(diff));
                    monday.setHours(0, 0, 0, 0);
                    handleLogHours(id, monday.toISOString().split("T")[0], hours);
                  }}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </CardsGrid>

          {/* Admin Button */}
          <div className="mt-8">
            <AdminButton onAddCourse={openAdd} />
          </div>

          {/* Empty state */}
          {courses.length === 0 && (
            <div className="text-center py-20 animate-fade-in glass rounded-[2.5rem] border border-dashed border-white/10 mt-8">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-zinc-800/30 flex items-center justify-center border border-white/5">
                <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3 italic tracking-tight uppercase">Ready to start?</h3>
              <p className="text-zinc-500 mb-8 max-w-xs mx-auto text-sm font-medium">
                {isAdmin
                  ? "Initialize your study deck by adding your first course."
                  : "Please sign in as an administrator to populate your dashboard."}
              </p>
            </div>
          )}
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
              onAdd={isAdmin ? (name, dueDate) => handleAddDeliverable(modal.courseId, name, dueDate) : () => { }}
              onDelete={isAdmin ? (id) => handleDeleteDeliverable(modal.courseId, id) : () => { }}
              onClose={closeModal}
              isAdmin={isAdmin}
            />
          );
        })()}
      </div>
    </div>
  );
}
