import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { messages: msgs, title } = body as {
    messages: Array<{
      id: string;
      role: string;
      content?: string;
      parts?: unknown;
    }>;
    title?: string;
  };

  // Delete existing messages and replace with current state
  await db.delete(messages).where(eq(messages.chatId, id));

  if (msgs.length > 0) {
    await db.insert(messages).values(
      msgs.map((msg) => ({
        id: msg.id,
        chatId: id,
        role: msg.role,
        content:
          msg.content ??
          (msg.parts as Array<{ type: string; text?: string }>)
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") ??
          null,
        parts: msg.parts ?? null,
      }))
    );
  }

  // Update chat title and timestamp
  if (title) {
    await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, id));
  } else {
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, id));
  }

  return Response.json({ ok: true });
}
