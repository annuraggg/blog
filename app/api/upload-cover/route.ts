import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";
import dns from "dns/promises";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB – matches /api/upload
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

/** Returns true when the address falls in a private/reserved range. */
function isPrivateAddress(ip: string): boolean {
  // IPv4 private / loopback / link-local / APIPA ranges
  const privateRanges =
    /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|0\.|::1$|fc|fd)/i;
  return privateRanges.test(ip);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["admin", "editor"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Validate URL format and protocol
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }

    // SSRF protection: resolve hostname and block private addresses
    try {
      const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
      for (const { address } of addresses) {
        if (isPrivateAddress(address)) {
          return NextResponse.json(
            { error: "URL resolves to a private or reserved address" },
            { status: 400 }
          );
        }
      }
    } catch {
      return NextResponse.json(
        { error: "Unable to resolve hostname" },
        { status: 400 }
      );
    }

    // Fetch the remote image with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "image/*" },
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch remote image" },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const baseType = contentType.split(";")[0].trim();
    if (!allowedTypes.includes(baseType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[baseType] ?? "jpg";
    const key = `uploads/${randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: baseType,
      })
    );

    const r2Url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url: r2Url, key });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}