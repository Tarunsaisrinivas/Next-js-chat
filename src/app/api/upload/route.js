import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

// New route segment config (replaces the old export const config)
export const dynamic = "force-dynamic"; // Required for file uploads
export const runtime = "nodejs"; // Required for filesystem operations
export const maxDuration = 30; // Maximum execution time in seconds

export async function POST(request) {
  try {
    console.log("Upload request received");

    const formData = await request.formData();
    const file = formData.get("file");

    console.log("File received:", file?.name);

    if (!file) {
      console.log("No file found in request");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (example: 5MB limit)
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating upload directory:", err);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Sanitize filename and create unique name
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
    const filename = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);
    console.log("File saved:", filePath);

    return NextResponse.json({
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
