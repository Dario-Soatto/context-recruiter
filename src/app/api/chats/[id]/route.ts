import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const chat = await db.select().from(chats).where(eq(chats.id, id));
  if (chat.length === 0) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(asc(messages.createdAt));

  return Response.json({
    ...chat[0],
    messages: msgs,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(chats).where(eq(chats.id, id));
  return Response.json({ ok: true });
}
