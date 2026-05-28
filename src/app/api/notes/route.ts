import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(notes).orderBy(desc(notes.createdAt));
  return Response.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = await db
    .insert(notes)
    .values({
      title: body.title ?? "Untitled",
      content: body.content ?? "",
    })
    .returning();
  return Response.json(result[0]);
}
