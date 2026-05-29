"use client";

import { useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2, UserCheck } from "lucide-react";
import { useCandidates, type Candidate } from "@/lib/candidates";
import { getChatInstance } from "@/lib/chat-store";
import { NotepadButton } from "./notepad";
import { SavedCandidatesButton } from "./saved-candidates-modal";
import { ToolCall } from "./tool-call";
import { AskUser } from "./ask-user";

export function Chat({
  chatId,
  initialMessages,
  initialQuery,
}: {
  chatId: string;
  initialMessages?: UIMessage[];
  initialQuery?: string;
}) {
  const chat = useMemo(
    () => getChatInstance(chatId, initialMessages),
    [chatId] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { messages, sendMessage, addToolResult, status } = useChat({ chat });
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSavedCount = useRef(initialMessages?.length ?? 0);
  const didSendInitial = useRef(false);

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-send initial query (from landing page redirect)
  useEffect(() => {
    if (initialQuery && !didSendInitial.current) {
      didSendInitial.current = true;
      sendMessage({ text: initialQuery });
    }
  }, [initialQuery, sendMessage]);

  const handleSubmit = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
  };

  // Save messages to DB when they change and we're not streaming
  useEffect(() => {
    if (isLoading) return;
    if (messages.length === 0) return;
    if (messages.length === lastSavedCount.current) return;

    lastSavedCount.current = messages.length;

    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? (firstUserMsg.parts as Array<{ type: string; text?: string }>)
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("")
          .slice(0, 60)
      : undefined;

    fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, title }),
    });
  }, [messages, isLoading, chatId]);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const { candidates, isOpen, setIsOpen } = useCandidates();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border">
        <NotepadButton />
        <SavedCandidatesButton />
        {!isOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
          >
            Candidates
            {candidates.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md ml-1">
                {candidates.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-lg">
                    <p className="text-sm leading-relaxed">
                      {message.parts
                        .filter((p) => p.type === "text")
                        .map((p) => (p.type === "text" ? p.text : ""))
                        .join("")}
                    </p>
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  chatId={chatId}
                  message={message}
                  isLoading={isLoading}
                  addToolResult={addToolResult}
                />
              )}
            </div>
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

// Streamdown's rehype-harden plugin rejects URLs that don't parse as absolute
// (no scheme), rendering them as plain text with a " [blocked]" suffix. The
// LLM often emits bare-domain URLs like "linkedin.com/in/foo" — prepend
// https:// for those so harden accepts them. Pass-through anything that already
// has a scheme, anchor, mailto, etc.
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url; // has a scheme
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("?")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  // Looks like a bare host (e.g. "linkedin.com/in/foo" or "x.com/handle")
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(url)) return `https://${url}`;
  return url;
}

function AssistantMessage({
  chatId,
  message,
  isLoading,
  addToolResult,
}: {
  chatId: string;
  message: { parts: Array<{ type: string; text?: string; [key: string]: unknown }> };
  isLoading: boolean;
  addToolResult: (params: { tool: string; toolCallId: string; output: unknown }) => void;
}) {
  const { addCandidates } = useCandidates();
  const handledToolCalls = useRef<Set<string>>(new Set());

  const elements: React.ReactNode[] = [];
  let textAccumulator = "";

  const flushText = (key: string) => {
    if (textAccumulator.trim()) {
      const text = textAccumulator;
      elements.push(
        <div key={key} className="max-w-none">
          <Streamdown
            mode={isLoading ? "streaming" : "static"}
            linkSafety={{ enabled: false }}
            urlTransform={normalizeUrl}
          >
            {text}
          </Streamdown>
        </div>
      );
    }
    textAccumulator = "";
  };

  // Track add_candidates outputs to push to sidebar
  const pendingOutputs = useRef<
    Array<{ toolCallId: string; output: { candidates: Candidate[] } }>
  >([]);
  pendingOutputs.current = [];

  message.parts.forEach((part, i) => {
    if (part.type === "text") {
      textAccumulator += part.text ?? "";
      return;
    }

    flushText(`text-${i}`);

    if (part.type.startsWith("tool-")) {
      const toolName = part.type.slice(5);
      const toolPart = part as unknown as {
        type: string;
        toolCallId: string;
        state: string;
        input: unknown;
        output: unknown;
        errorText?: string;
      };

      if (toolName === "ask_user") {
        const input = toolPart.input as { question: string } | undefined;
        elements.push(
          <AskUser
            key={i}
            question={input?.question ?? ""}
            toolCallId={toolPart.toolCallId}
            addToolResult={addToolResult}
            answered={toolPart.state === "output-available"}
          />
        );
        return;
      }

      if (toolName === "add_candidates") {
        const input = toolPart.input as {
          candidates: Array<{ id: string; fullName: string }>;
        } | undefined;
        const output = toolPart.output as {
          count: number;
          candidates: Candidate[];
        } | undefined;

        // When output is available, queue it for sidebar
        if (
          toolPart.state === "output-available" &&
          output?.candidates &&
          !handledToolCalls.current.has(toolPart.toolCallId)
        ) {
          pendingOutputs.current.push({
            toolCallId: toolPart.toolCallId,
            output: { candidates: output.candidates },
          });
        }

        const count = output?.count ?? input?.candidates?.length ?? 0;
        const isRunning =
          toolPart.state === "input-streaming" ||
          toolPart.state === "input-available";

        elements.push(
          <div
            key={i}
            className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
          >
            <div className="flex items-center justify-center size-5 rounded-md bg-emerald-500/10">
              {isRunning ? (
                <Loader2 className="size-3 animate-spin text-emerald-500" />
              ) : (
                <UserCheck className="size-3 text-emerald-500" />
              )}
            </div>
            <span className="font-medium">
              {isRunning
                ? `Enriching ${input?.candidates?.length ?? ""} candidates...`
                : `Added ${count} candidates to sidebar`}
            </span>
          </div>
        );
        return;
      }

      elements.push(
        <ToolCall
          key={i}
          toolName={toolName}
          state={toolPart.state}
          input={toolPart.input}
          output={toolPart.output}
          errorText={toolPart.errorText}
        />
      );
    }
  });

  flushText("text-final");

  // Push enriched candidates to sidebar
  useEffect(() => {
    for (const pending of pendingOutputs.current) {
      if (handledToolCalls.current.has(pending.toolCallId)) continue;
      handledToolCalls.current.add(pending.toolCallId);
      addCandidates(chatId, pending.output.candidates);
    }
  });

  return <div className="space-y-3">{elements}</div>;
}

function QueryInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const value = textareaRef.current?.value;
    if (value?.trim() && !isLoading) {
      onSubmit(value);
      if (textareaRef.current) {
        textareaRef.current.value = "";
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder="Describe who you're looking for..."
        disabled={isLoading}
        rows={1}
        className="min-h-[48px] max-h-[200px] resize-none pr-12 rounded-xl border-border bg-card text-sm leading-relaxed placeholder:text-muted-foreground/60"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, 200) + "px";
        }}
      />
      <Button
        size="icon-sm"
        onClick={handleSubmit}
        disabled={isLoading}
        className="absolute right-2 bottom-2"
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ArrowUp className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
