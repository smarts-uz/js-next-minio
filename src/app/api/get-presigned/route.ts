import { NextResponse, type NextRequest } from "next/server";
import { minioClient } from "@/lib/minio";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const bucket = searchParams.get("bucket");
  const objectName = searchParams.get("object");

  if (!bucket || !objectName) {
    return NextResponse.json(
      { error: "bucket and object are required" },
      { status: 400 }
    );
  }

  try {
    const url = await minioClient.presignedGetObject(
      bucket,
      objectName,
      60 * 10 // 10 minutes
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
