import { NextResponse } from "next/server";
import imagekit from "../../lib/imagekit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ===== VALIDATION SECTION =====
    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only JPG, PNG, and PDF are allowed." },
        { status: 415 }
      );
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 413 }
      );
    }
    // ===== END VALIDATION =====

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: `${Date.now()}-${file.name}`,
      folder: "/chat-uploads",
    });

    return NextResponse.json({
      url: response.url,
      fileId: response.fileId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
