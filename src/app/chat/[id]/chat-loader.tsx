"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type UIMessage } from "ai";
import { Chat } from "@/components/chat";

export function ChatLoader({ chatId }: { chatId: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // If there's an initial query, skip loading from DB — this is a new chat
    if (initialQuery) {
      setLoaded(true);
      return;
    }

    fetch(`/api/chats/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setInitialMessages(
            data.messages.map(
              (m: { id: string; role: string; content: string; parts: unknown }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                parts: m.parts ?? [{ type: "text", text: m.content ?? "" }],
              })
            )
          );
        }
        setLoaded(true);
      });
  }, [chatId, initialQuery]);

  if (!loaded) return null;

  return (
    <Chat
      chatId={chatId}
      initialMessages={initialMessages}
      initialQuery={initialQuery ?? undefined}
    />
  );
}
