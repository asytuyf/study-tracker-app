import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Force dynamic rendering (don't try to pre-render at build time)
export const dynamic = "force-dynamic";

// GET all courses
export async function GET() {
    try {
        const { data, error } = await getSupabase()
            .from("courses")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Transform from DB format to app format
        const courses = data.map((row) => ({
            id: row.id,
            name: row.name,
            examDate: row.exam_date,
            totalChapters: row.total_chapters,
            completedChapters: row.completed_chapters,
            color: row.color,
            courseType: row.course_type,
            startDate: row.start_date,
            hasMidterm: row.has_midterm,
            midtermDate: row.midterm_date,
            midtermChapters: row.midterm_chapters,
            midtermCompleted: row.midterm_completed,
            deliverables: row.deliverables || [],
        }));

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST - add a new course
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // If body is an array, replace all courses (sync from client)
        if (Array.isArray(body)) {
            // Delete all existing and insert new
            await getSupabase().from("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000");

            if (body.length > 0) {
                const rows = body.map((course) => ({
                    id: course.id,
                    name: course.name,
                    exam_date: course.examDate,
                    total_chapters: course.totalChapters,
                    completed_chapters: course.completedChapters,
                    color: course.color,
                    course_type: course.courseType,
                    start_date: course.startDate,
                    has_midterm: course.hasMidterm,
                    midterm_date: course.midtermDate,
                    midterm_chapters: course.midtermChapters,
                    midterm_completed: course.midtermCompleted,
                    deliverables: course.deliverables || [],
                }));

                const { error } = await getSupabase().from("courses").insert(rows);
                if (error) throw error;
            }

            return NextResponse.json(body);
        }

        // Single course insert
        const row = {
            id: body.id || crypto.randomUUID(),
            name: body.name,
            exam_date: body.examDate,
            total_chapters: body.totalChapters,
            completed_chapters: body.completedChapters || 0,
            color: body.color,
            course_type: body.courseType,
            start_date: body.startDate,
            has_midterm: body.hasMidterm,
            midterm_date: body.midtermDate,
            midterm_chapters: body.midtermChapters,
            midterm_completed: body.midtermCompleted,
            deliverables: body.deliverables || [],
        };

        const { data, error } = await getSupabase().from("courses").insert(row).select().single();
        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Failed to add course:", error);
        return NextResponse.json({ error: "Failed to add course" }, { status: 500 });
    }
}

// PUT - update a course
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 });
        }

        const row: Record<string, unknown> = {};
        if (updates.name !== undefined) row.name = updates.name;
        if (updates.examDate !== undefined) row.exam_date = updates.examDate;
        if (updates.totalChapters !== undefined) row.total_chapters = updates.totalChapters;
        if (updates.completedChapters !== undefined) row.completed_chapters = updates.completedChapters;
        if (updates.color !== undefined) row.color = updates.color;
        if (updates.courseType !== undefined) row.course_type = updates.courseType;
        if (updates.startDate !== undefined) row.start_date = updates.startDate;
        if (updates.hasMidterm !== undefined) row.has_midterm = updates.hasMidterm;
        if (updates.midtermDate !== undefined) row.midterm_date = updates.midtermDate;
        if (updates.midtermChapters !== undefined) row.midterm_chapters = updates.midtermChapters;
        if (updates.midtermCompleted !== undefined) row.midterm_completed = updates.midtermCompleted;
        if (updates.deliverables !== undefined) row.deliverables = updates.deliverables;

        const { data, error } = await getSupabase()
            .from("courses")
            .update(row)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to update course:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}

// DELETE - remove a course
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 });
        }

        const { error } = await getSupabase().from("courses").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete course:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}
