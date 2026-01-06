import { NextResponse } from "next/server";
import { minioClient } from "@/lib/minio";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
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
}
