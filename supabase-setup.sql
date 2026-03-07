-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    total_chapters INTEGER NOT NULL,
    completed_chapters INTEGER DEFAULT 0,
    color TEXT NOT NULL,
    course_type TEXT NOT NULL CHECK (course_type IN ('current', 'self-study')),
    start_date DATE,
    has_midterm BOOLEAN DEFAULT FALSE,
    midterm_date DATE,
    midterm_chapters INTEGER,
    midterm_completed BOOLEAN DEFAULT FALSE,
    deliverables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read courses (public viewing)
CREATE POLICY "Anyone can view courses"
    ON courses FOR SELECT
    USING (true);

-- Allow anyone to insert/update/delete (auth is handled by NextAuth in the app)
-- For production, you might want to restrict this more
CREATE POLICY "Anyone can insert courses"
    ON courses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update courses"
    ON courses FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete courses"
    ON courses FOR DELETE
    USING (true);
