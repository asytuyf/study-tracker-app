"use client";

import styled from "styled-components";
import { Course } from "../types";
import { useMemo } from "react";

const AnalysisWrapper = styled.div`
  margin-top: 4rem;
  padding: 2rem;
  border-radius: 2.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
`;

const BarContainer = styled.div`
  height: 8px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const BarFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${(props: { $width: number; $color: string }) => Math.min(100, props.$width)}%;
  background: ${(props: { $width: number; $color: string }) => {
        const parts = props.$color.split(" ");
        const fromColor = parts[0]?.replace("from-", "") || "blue-500";
        const toColor = parts[1]?.replace("to-", "") || "cyan-400";
        return `linear-gradient(90deg, var(--${fromColor}, #3b82f6), var(--${toColor}, #22d3ee))`;
    }};
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
`;

function getMonday(d: Date) {
    d = new Date(d);
    const day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

interface WeeklyAnalysisProps {
    courses: Course[];
}

export default function WeeklyAnalysis({ courses }: WeeklyAnalysisProps) {
    const currentWeek = useMemo(() => getMonday(new Date()), []);

    const projectsWithGoals = courses.filter(c => c.itemType === "project" || (c.weeklyHourGoal && c.weeklyHourGoal > 0));

    const stats = projectsWithGoals.map(p => {
        const log = p.weeklyLogs?.find(l => l.date === currentWeek);
        const hours = log?.hours || 0;
        const goal = p.weeklyHourGoal || 10;
        const percent = (hours / goal) * 100;
        return {
            name: p.name,
            hours,
            goal,
            percent,
            color: p.color
        };
    });

    if (projectsWithGoals.length === 0) return null;

    const totalHours = stats.reduce((acc, s) => acc + s.hours, 0);

    return (
        <AnalysisWrapper>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Performance Review</p>
                    <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Weekly Analysis</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Effort</p>
                        <p className="text-2xl font-black text-white">{totalHours} <span className="text-sm font-normal text-zinc-500">hrs</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stats.map((s, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <p className="text-xs font-bold text-zinc-400 mb-0.5">{s.name}</p>
                                <p className="text-lg font-black text-white">{s.hours} <span className="text-xs font-normal text-zinc-500">/ {s.goal} hrs</span></p>
                            </div>
                            <p className="text-sm font-black text-white">{Math.round(s.percent)}%</p>
                        </div>
                        <BarContainer>
                            <BarFill $width={s.percent} $color={s.color} />
                        </BarContainer>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-medium">
                    Analytics based on the week starting <span className="text-zinc-300">{new Date(currentWeek).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>.
                </p>
            </div>
        </AnalysisWrapper>
    );
}
