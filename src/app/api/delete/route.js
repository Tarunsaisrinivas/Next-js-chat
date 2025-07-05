// app/api/delete/route.js
import { NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";

export async function POST(request) {
  const { fileId } = await request.json();

  try {
    await imagekit.deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
