"use client";

import styled from "styled-components";
import { Course, Deliverable } from "../types";
import { getStatus, getBehindAmount, formatDaysUntil, getDaysUntil } from "../hooks/useCourses";

const PlanWrapper = styled.div`
  margin-bottom: 3rem;
  animation: fadeIn 0.8s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const PriorityCard = styled.div<{ $gradient: string }>`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${(props: { $gradient: string }) => {
        const parts = props.$gradient.split(" ");
        const fromColor = parts[0]?.replace("from-", "") || "blue-500";
        const toColor = parts[1]?.replace("to-", "") || "cyan-400";
        return `linear-gradient(to bottom, var(--${fromColor}, #3b82f6), var(--${toColor}, #22d3ee))`;
    }};
  }
`;

interface CurrentPlanProps {
    courses: Course[];
    onEditCourse: (course: Course) => void;
}

export default function CurrentPlan({ courses, onEditCourse }: CurrentPlanProps) {
    const behindItems = courses.filter(c => getStatus(c) === "behind");

    const urgentTasks: { courseName: string; task: Deliverable; color: string }[] = [];
    courses.forEach(c => {
        c.deliverables?.forEach(d => {
            if (!d.completed && d.dueDate) {
                const days = getDaysUntil(d.dueDate);
                if (days <= 7) {
                    urgentTasks.push({ courseName: c.name, task: d, color: c.color });
                }
            }
        });
    });

    // Sort urgent tasks by due date
    urgentTasks.sort((a, b) => getDaysUntil(a.task.dueDate!) - getDaysUntil(b.task.dueDate!));

    if (behindItems.length === 0 && urgentTasks.length === 0) {
        return null;
    }

    return (
        <PlanWrapper>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Current Plan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {behindItems.slice(0, 2).map(course => (
                    <PriorityCard
                        key={course.id}
                        $gradient={course.color}
                        onClick={() => onEditCourse(course)}
                        className="cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Action Required
                        </p>
                        <h3 className="text-lg font-black text-white mb-1">{course.name}</h3>
                        <p className="text-sm text-zinc-400">
                            You are <span className="text-white font-bold">{getBehindAmount(course)} chapters</span> behind schedule.
                        </p>
                    </PriorityCard>
                ))}

                {urgentTasks.slice(0, 2).map((item, idx) => (
                    <PriorityCard key={idx} $gradient={item.color}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Upcoming Deadline
                        </p>
                        <h3 className="text-lg font-black text-white mb-1">{item.task.name}</h3>
                        <p className="text-sm text-zinc-400">
                            {item.courseName} • <span className="text-white font-bold">{formatDaysUntil(getDaysUntil(item.task.dueDate!), "Due")}</span>
                        </p>
                    </PriorityCard>
                ))}
            </div>
        </PlanWrapper>
    );
}
