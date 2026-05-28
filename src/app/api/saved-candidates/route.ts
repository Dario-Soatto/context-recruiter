import { db } from "@/lib/db";
import { savedCandidates } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select()
    .from(savedCandidates)
    .orderBy(desc(savedCandidates.createdAt));
  return Response.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await db
    .insert(savedCandidates)
    .values({
      aviatoId: body.aviatoId,
      fullName: body.fullName,
      location: body.location ?? null,
      linkedinUrl: body.linkedinUrl ?? null,
      twitterUrl: body.twitterUrl ?? null,
      enrichment: body.enrichment ?? null,
      notes: body.notes ?? null,
    })
    .returning();
  return Response.json(result[0]);
}
