import { NextRequest, NextResponse } from "next/server";

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // format: owner/repo
const FILE_PATH = "data/courses.json";
const BRANCH = "main";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getFileFromGitHub(): Promise<{ content: string; sha: string } | null> {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        return null;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            console.error("GitHub fetch failed:", response.status);
            return null;
        }

        const data = await response.json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return { content, sha: data.sha };
    } catch (error) {
        console.error("Failed to fetch from GitHub:", error);
        return null;
    }
}

async function saveFileToGitHub(content: string, sha: string): Promise<boolean> {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        return false;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: "Update courses data",
                    content: Buffer.from(content).toString("base64"),
                    sha: sha,
                    branch: BRANCH,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("GitHub save failed:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Failed to save to GitHub:", error);
        return false;
    }
}

// GET all courses
export async function GET() {
    const file = await getFileFromGitHub();

    if (!file) {
        // Return empty array if GitHub not configured or fetch failed
        return NextResponse.json([]);
    }

    try {
        const courses = JSON.parse(file.content);
        return NextResponse.json(courses);
    } catch {
        return NextResponse.json([]);
    }
}

// POST - save all courses (replaces entire file)
export async function POST(request: NextRequest) {
    try {
        const courses = await request.json();

        // Get current file to get SHA
        const file = await getFileFromGitHub();
        if (!file) {
            return NextResponse.json(
                { error: "GitHub not configured or unavailable" },
                { status: 500 }
            );
        }

        // Save to GitHub
        const success = await saveFileToGitHub(
            JSON.stringify(courses, null, 2),
            file.sha
        );

        if (!success) {
            return NextResponse.json(
                { error: "Failed to save to GitHub" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save courses:", error);
        return NextResponse.json(
            { error: "Failed to save courses" },
            { status: 500 }
        );
    }
}
