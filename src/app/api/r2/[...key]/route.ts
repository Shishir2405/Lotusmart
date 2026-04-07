import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_NAME ?? "weibaomedia";

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

const CACHE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const client = getClient();
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const response = await client.send(command);

    const body = response.Body;
    if (!body) {
      return NextResponse.json({ error: "Empty response" }, { status: 404 });
    }

    const bytes = await body.transformToByteArray();
    const contentType = response.ContentType ?? "application/octet-stream";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code === "NoSuchKey") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("R2 proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
