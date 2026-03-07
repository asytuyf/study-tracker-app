export interface Deliverable {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string; // optional deadline
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  chapters: number;
  completed: boolean;
}

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

  // Midterm milestones (multiple supported)
  midterms?: Milestone[];

  // For tracking specific deliverables (Problem sets, assignments)
  deliverables?: Deliverable[];

  // Exam notes or description
  description?: string;
}

export type CourseStatus = "ahead" | "on-track" | "behind";
