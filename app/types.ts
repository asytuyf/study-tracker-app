export interface Deliverable {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  category?: "implementation" | "scientific"; // For projects
}

export interface WeeklyPlanTask {
  id: string;
  text: string;
  done: boolean;
  courseId?: string; // optional link to a course/project
  weekDate: string;  // ISO Monday of the week
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  chapters: number;
  completed: boolean;
}

export interface ChapterNote {
  id: string;
  chapterNumber: number;
  title: string;
  content: string; // Markdown with LaTeX ($...$ and $$...$$)
  lastUpdated: string;
}

export interface WeeklyLog {
  id: string;
  date: string; // ISO date of the Monday of that week
  hours: number;
}

export interface ChapterSchedule {
  week: number;
  chapters: number[];
}

export interface Course {
  id: string;
  name: string;
  examDate: string;
  totalChapters: number;
  completedChapters: number;
  color: string;

  // Study item type
  itemType: "course" | "project";

  // Course type (legacy/compatibility)
  courseType: "current" | "self-study";

  // Weekly hourly goal for projects
  weeklyHourGoal?: number;

  // Logs for hourly work
  weeklyLogs?: WeeklyLog[];

  // Detailed schedule
  chapterSchedule?: ChapterSchedule[];

  // Start date
  startDate?: string;

  // Midterm milestones
  midterms?: Milestone[];

  // Deliverables (Problem sets, assignments)
  deliverables?: Deliverable[];

  // Description
  description?: string;

  // NEW: Notes per chapter
  notes?: ChapterNote[];

  // NEW: PDF links (Google Cloud Storage or any URL)
  pdfLinks?: {
    id: string;
    name: string; // e.g., "Chapter 1 Slides", "Exercise Sheet 1"
    url: string;
    type: "slides" | "exercises" | "solutions" | "other";
  }[];

  // NotebookLM link for AI-powered study chat
  notebookLMLink?: string;

  // Notion page link for notes and resources
  notionLink?: string;
}

export type CourseStatus = "ahead" | "on-track" | "behind";
