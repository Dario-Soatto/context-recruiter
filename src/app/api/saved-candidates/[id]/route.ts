import { db } from "@/lib/db";
import { savedCandidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(savedCandidates).where(eq(savedCandidates.id, id));
  return Response.json({ ok: true });
}
