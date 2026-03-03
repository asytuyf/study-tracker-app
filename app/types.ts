export interface Course {
  id: string;
  name: string;
  examDate: string;
  totalChapters: number;
  completedChapters: number;
  color: string;

  // Course type
  courseType: "current" | "self-study";

  // Start date (for both current and self-study to track pace)
  startDate?: string;

  // Only for current courses (attending lectures)
  hasMidterm?: boolean;
  midtermDate?: string;
  midtermChapters?: number;
  midtermCompleted?: boolean;

  // For tracking specific deliverables (Problem sets, assignments)
  deliverables?: {
    id: string;
    name: string;
    completed: boolean;
  }[];
}

export type CourseStatus = 'ahead' | 'on-track' | 'behind';
