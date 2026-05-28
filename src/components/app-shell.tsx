"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatSidebar } from "./chat-sidebar";
import { CandidateSidebar } from "./candidate-sidebar";
import { CandidatesProvider, useCandidates } from "@/lib/candidates";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { setActiveChatId } = useCandidates();

  const activeChatId = pathname.startsWith("/chat/")
    ? pathname.slice(6)
    : null;

  // Sync active chat ID with candidates context
  useEffect(() => {
    setActiveChatId(activeChatId);
  }, [activeChatId, setActiveChatId]);

  return (
    <div className="flex h-screen">
      <ChatSidebar
        activeChatId={activeChatId}
        onSelectChat={(id) => router.push(`/chat/${id}`)}
        onNewChat={() => router.push("/")}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex-1 min-w-0">{children}</div>
      <CandidateSidebar />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CandidatesProvider>
      <AppShellInner>{children}</AppShellInner>
    </CandidatesProvider>
  );
}
