import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { createHash } from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());

    // Use content hash as key to avoid re-uploading identical files
    const hash = createHash("sha256").update(buffer).digest("hex");
    const key = `uploads/${hash}.${ext}`;

    // Check if this exact file already exists in R2
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
        })
      );
      // File already exists — return existing URL
      const url = `${process.env.R2_PUBLIC_URL}/${key}`;
      return NextResponse.json({ url, alt, key });
    } catch (headErr: unknown) {
      // Only proceed if the object was not found (404 / NoSuchKey)
      const code = (headErr as { name?: string; $metadata?: { httpStatusCode?: number } })?.name
        ?? (headErr as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode?.toString();
      if (code !== "NotFound" && code !== "NoSuchKey" && code !== "404") {
        console.error("HeadObject error:", headErr);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      // Object does not exist yet, proceed with upload
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: { alt },
      })
    );

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url, alt, key });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
