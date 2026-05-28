import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const result = await db
    .update(notes)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      updatedAt: new Date(),
    })
    .where(eq(notes.id, id))
    .returning();
  return Response.json(result[0]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(notes).where(eq(notes.id, id));
  return Response.json({ ok: true });
}
