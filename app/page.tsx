"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Course } from "./types";
import { useCourses } from "./hooks/useCourses";
import CourseCard from "./components/CourseCard";
import CourseModal from "./components/CourseModal";
import ProgressModal from "./components/ProgressModal";
import DeliverablesModal from "./components/DeliverablesModal";
import BubbleCluster from "./components/BubbleCluster";
import AdminButton from "./components/AdminButton";

// Today's date formatted nicely
function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
    mounted,
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
    <div className="min-h-screen pb-24 bg-[#0f1117] relative">
      {/* Fixed circuit grid background */}
      <div className="circuit-background" />

      {/* Floating bubbles — left and right, only on wide screens */}
      <BubbleCluster side="left" />
      <BubbleCluster side="right" />


      {/* All content sits above the background */}
      <div className="relative z-10">
        {/* ── Header: Clean & Elegant ── */}
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.2em] mb-3">
            {getTodayLabel()}
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Study<span className="text-blue-500">Tracker</span>
          </h1>
          <div className="h-1 w-20 bg-blue-500/30 mx-auto mt-6 rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto px-6">
          {/* Quick Stats Grid */}
          {courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Semester</p>
                <p className="text-2xl font-black text-white">{currentCount}</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Flexible</p>
                <p className="text-2xl font-black text-white">{flexCount}</p>
              </div>
              <div className="glass rounded-2xl p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Overall</p>
                <p className="text-2xl font-black text-blue-400">{overallProgress}%</p>
              </div>
            </div>
          )}

          {/* Course cards */}
          <div className="space-y-4">
            {sortedCourses.map((course, index) => (
              <CourseCard
                key={course.id}
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
                isAdmin={isAdmin}
              />
            ))}
          </div>

          {/* Admin Button - shows login or add course depending on auth state */}
          <div className="mt-6">
            <AdminButton onAddCourse={openAdd} />
          </div>

          {/* Empty state */}
          {courses.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No courses yet</h3>
              <p className="text-zinc-500 mb-6 max-w-xs mx-auto">
                {isAdmin
                  ? "Add your first course above to start tracking your study progress."
                  : "Login as admin to add courses and start tracking."}
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
              onSave={(progress, midtermDone) => {
                handleUpdateProgress(modal.courseId, progress, midtermDone);
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
              onToggle={isAdmin ? (id) => handleToggleDeliverable(modal.courseId, id) : () => {}}
              onAdd={isAdmin ? (name, dueDate) => handleAddDeliverable(modal.courseId, name, dueDate) : () => {}}
              onDelete={isAdmin ? (id) => handleDeleteDeliverable(modal.courseId, id) : () => {}}
              onClose={closeModal}
              isAdmin={isAdmin}
            />
          );
        })()}
      </div>
    </div>
  );
}
