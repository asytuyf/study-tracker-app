import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Course } from "@/app/types";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const COURSES_KEY = "courses";

// GET all courses
export async function GET() {
    try {
        const courses = await redis.get<Course[]>(COURSES_KEY);
        return NextResponse.json(courses || []);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST - add a new course or replace all courses
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // If body is an array, replace all courses
        if (Array.isArray(body)) {
            await redis.set(COURSES_KEY, body);
            return NextResponse.json(body);
        }

        // Otherwise, add a single course
        const courses = await redis.get<Course[]>(COURSES_KEY) || [];
        const newCourse: Course = {
            ...body,
            id: crypto.randomUUID(),
        };
        courses.push(newCourse);
        await redis.set(COURSES_KEY, courses);
        return NextResponse.json(newCourse, { status: 201 });
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

        const courses = await redis.get<Course[]>(COURSES_KEY) || [];
        const index = courses.findIndex((c) => c.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        courses[index] = { ...courses[index], ...updates };
        await redis.set(COURSES_KEY, courses);
        return NextResponse.json(courses[index]);
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

        const courses = await redis.get<Course[]>(COURSES_KEY) || [];
        const filtered = courses.filter((c) => c.id !== id);

        if (filtered.length === courses.length) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        await redis.set(COURSES_KEY, filtered);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete course:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}
