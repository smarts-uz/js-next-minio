import { NextResponse } from "next/server";
import { z } from "zod";
import { minioClient } from "@/lib/minio";
import prisma from "@/lib/prisma";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Server-side file validation schema
const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File is required")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 100MB"
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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file with Zod
    const validation = fileSchema.safeParse({ file });

    if (!validation.success) {
      const errors = validation.error.issues.map((err) => err.message);
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const url = `${process.env.MINIO_URL}/${process.env.MINIO_BUCKET}/${fileName}`;

    await minioClient.putObject(
      process.env.MINIO_BUCKET!,
      fileName,
      buffer,
      buffer.length,
      {
        "Content-Type": file.type,
      }
    );

    const row = await prisma.file.create({
      data: {
        fileName,
        url,
        size: file.size,
        bucket: process.env.MINIO_BUCKET!,
        originalName: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: row,
      url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
