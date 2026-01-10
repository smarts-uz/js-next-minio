import { NextResponse } from "next/server";
import { minioClient } from "@/lib/minio";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    const bucketName = process.env.MINIO_BUCKET!;
    const objectName = `${Date.now()}-${filename}`;

    // Generate presigned POST URL (15 minutes expiry)
    const presignedUrl = await minioClient.presignedPutObject(
      bucketName,
      objectName,
      15 * 60 // 15 minutes
    );

    return NextResponse.json({
      url: presignedUrl,
      method: "PUT",
      fields: {},
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      objectName,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// New endpoint to save file metadata after successful upload
export async function PUT(req: Request) {
  try {
    const { fileName, originalName, size, contentType } = await req.json();

    const bucketName = process.env.MINIO_BUCKET!;
    const url = `${process.env.MINIO_URL}/${bucketName}/${fileName}`;

    const row = await prisma.file.create({
      data: {
        fileName,
        url,
        size,
        bucket: bucketName,
        originalName,
      },
    });

    return NextResponse.json({
      success: true,
      data: row,
      url,
    });
  } catch (error) {
    console.error("Metadata save error:", error);
    return NextResponse.json(
      { error: "Failed to save file metadata" },
      { status: 500 }
    );
  }
}
