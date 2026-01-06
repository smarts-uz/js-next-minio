import { NextResponse } from "next/server";
import { z } from "zod";
import { minioClient } from "@/lib/minio";

// Server-side file validation schema
const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File is required")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "text/plain",
        ].includes(file.type),
      "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, Text"
    ),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file with Zod
    const validation = fileSchema.safeParse({ file });

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message);
      return NextResponse.json(
        { error: errors.join(", ") },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    await minioClient.putObject(
      process.env.MINIO_BUCKET!,
      fileName,
      buffer,
      buffer.length,
      {
        "Content-Type": file.type,
      }
    );

    return NextResponse.json({
      success: true,
      fileName,
      url: `http://localhost:9000/${process.env.MINIO_BUCKET}/${fileName}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
