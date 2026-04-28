import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { normalizeTags } from "@/lib/cache-tags";

function getExpectedSecret(): string | null {
  return process.env.FRONTEND_REVALIDATE_SECRET ?? process.env.REVALIDATE_SECRET ?? null;
}

export async function POST(request: NextRequest) {
  const expectedSecret = getExpectedSecret();
  const receivedSecret = request.headers.get("x-revalidate-secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tags = normalizeTags((body as { tags?: unknown }).tags);

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ ok: true, revalidatedTags: tags });
}
