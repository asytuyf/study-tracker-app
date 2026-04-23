"use client";

import styled from "styled-components";
import { Course } from "../types";

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ChapterBox = styled.button<{ $done: boolean; $color: string }>`
  aspect-ratio: 1;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  ${(props: { $done: boolean; $color: string }) => {
        const parts = props.$color.split(" ");
        const fromColor = parts[0]?.replace("from-", "") || "blue-500";
        const toColor = parts[1]?.replace("to-", "") || "cyan-400";

        return props.$done
            ? `
    background: linear-gradient(135deg, var(--${fromColor}, #3b82f6) 0%, var(--${toColor}, #22d3ee) 100%);
    background-color: #3b82f6; /* Fallback */
    color: white;
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
  `
            : `
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.3);
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.6);
      transform: translateY(-2px);
    }
  `;
    }}
`;

interface ChapterGridProps {
    course: Course;
    onToggle: (chapterNum: number) => void;
    onToggleExercise?: (exerciseNum: number) => void;
    isAdmin?: boolean;
}

export default function ChapterGrid({ course, onToggle, onToggleExercise, isAdmin }: ChapterGridProps) {
    const chapters = Array.from({ length: course.totalChapters }, (_: any, i: number) => i + 1);
    const exercises = course.totalExercises ? Array.from({ length: course.totalExercises }, (_: any, i: number) => i + 1) : [];

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Chapter Progress
                </h4>
                <span className="text-[10px] font-black text-zinc-600">
                    {course.completedChapters} / {course.totalChapters}
                </span>
            </div>

            <GridContainer>
                {chapters.map((num: number) => {
                    const isDone = course.completedChaptersList 
                        ? course.completedChaptersList.includes(num)
                        : num <= course.completedChapters;
                        
                    return (
                        <ChapterBox
                            key={num}
                            $done={isDone}
                            $color={course.color || "from-blue-500 to-cyan-400"}
                            onClick={() => isAdmin && onToggle(num)}
                            disabled={!isAdmin}
                            title={`Chapter ${num}`}
                        >
                            {num}
                        </ChapterBox>
                    );
                })}
            </GridContainer>

            {exercises.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Exercise Sheets
                        </h4>
                        <span className="text-[10px] font-black text-zinc-600">
                            {course.completedExercises || 0} / {course.totalExercises}
                        </span>
                    </div>
                    <GridContainer>
                        {exercises.map((num: number) => {
                            const isDone = course.completedExercisesList
                                ? course.completedExercisesList.includes(num)
                                : num <= (course.completedExercises || 0);

                            return (
                                <ChapterBox
                                    key={num}
                                    $done={isDone}
                                    $color={course.color || "from-blue-500 to-cyan-400"}
                                    onClick={() => isAdmin && onToggleExercise?.(num)}
                                    disabled={!isAdmin}
                                    title={`Exercise Sheet ${num}`}
                                >
                                    {num}
                                </ChapterBox>
                            );
                        })}
                    </GridContainer>
                </div>
            )}

            {course.chapterSchedule && course.chapterSchedule.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    {course.chapterSchedule.map((sched) => (
                        <div key={sched.week} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Week {sched.week}</span>
                                <div className="h-[1px] flex-1 bg-white/5" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sched.chapters.map((ch: number) => {
                                    const isChDone = course.completedChaptersList 
                                        ? course.completedChaptersList.includes(ch)
                                        : ch <= course.completedChapters;
                                    return (
                                        <button
                                            key={ch}
                                            onClick={() => isAdmin && onToggle(ch)}
                                            disabled={!isAdmin}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${isChDone
                                                ? "bg-white/10 text-white"
                                                : "bg-zinc-900/50 text-zinc-600 hover:text-zinc-400"
                                                }`}
                                        >
                                            Ch. {ch}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
