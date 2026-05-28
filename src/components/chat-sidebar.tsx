"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { deleteChatInstance } from "@/lib/chat-store";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { UserButton, SignInButton, Show } from "@clerk/nextjs";

type ChatEntry = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ChatSidebar({
  activeChatId,
  onSelectChat,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}: {
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [chatList, setChatList] = useState<ChatEntry[]>([]);
  const pathname = usePathname();

  // Refresh chat list whenever the route changes
  useEffect(() => {
    fetch("/api/chats")
      .then((res) => res.json())
      .then((data: ChatEntry[]) => setChatList(data));
  }, [pathname]);

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatInstance(id);
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
    setChatList((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      onNewChat();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-border bg-muted/30 flex flex-col items-center py-3 gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          title="Expand sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onNewChat}
          title="New chat"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[240px] border-r border-border bg-muted/30 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </Button>
          <span className="text-sm font-semibold">Chats</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onNewChat} title="New chat">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatList.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="size-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No chats yet</p>
          </div>
        ) : (
          chatList.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <MessageSquare className="size-3.5 shrink-0" />
                <span className="text-sm truncate flex-1 min-w-0">
                  {chat.title || "New Chat"}
                </span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
                  title="Delete chat"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* User */}
      <div className="border-t border-border px-3 py-2.5">
        <Show when="signed-in">
          <UserButton
            showName
            appearance={{
              elements: {
                rootBox: "w-full",
                userButtonTrigger: "w-full justify-start",
              },
            }}
          />
        </Show>
        <Show when="signed-out">
          <SignInButton>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </Show>
      </div>
    </div>
  );
}
