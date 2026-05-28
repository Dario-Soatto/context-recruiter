import { db } from "@/lib/db";
import { chatCandidates } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db
    .select()
    .from(chatCandidates)
    .where(eq(chatCandidates.chatId, id))
    .orderBy(asc(chatCandidates.createdAt));
  return Response.json(result);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { candidates } = body as {
    candidates: Array<{
      aviatoId: string;
      fullName: string;
      location?: string;
      linkedinUrl?: string;
      twitterUrl?: string;
      enrichment?: unknown;
    }>;
  };

  if (candidates.length > 0) {
    await db.insert(chatCandidates).values(
      candidates.map((c) => ({
        chatId: id,
        aviatoId: c.aviatoId,
        fullName: c.fullName,
        location: c.location ?? null,
        linkedinUrl: c.linkedinUrl ?? null,
        twitterUrl: c.twitterUrl ?? null,
        enrichment: c.enrichment ?? null,
      }))
    );
  }

  return Response.json({ ok: true, count: candidates.length });
}
