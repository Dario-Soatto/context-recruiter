import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select()
    .from(chats)
    .orderBy(desc(chats.updatedAt));
  return Response.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await db
    .insert(chats)
    .values({
      title: body.title ?? "New Chat",
    })
    .returning();
  return Response.json(result[0]);
}
