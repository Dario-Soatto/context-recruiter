"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircleQuestion, Send } from "lucide-react";

interface AskUserProps {
  question: string;
  toolCallId: string;
  addToolResult: (params: {
    tool: string;
    toolCallId: string;
    output: unknown;
  }) => void;
  answered: boolean;
}

export function AskUser({
  question,
  toolCallId,
  addToolResult,
  answered,
}: AskUserProps) {
  const [answer, setAnswer] = useState("");

  const submit = () => {
    if (answer.trim()) {
      addToolResult({ tool: "ask_user", toolCallId, output: answer.trim() });
      setAnswer("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 my-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10 mt-0.5 shrink-0">
          <MessageCircleQuestion className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-sm leading-relaxed">{question}</p>
          {!answered ? (
            <div className="flex gap-2">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Type your answer..."
                className="text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={submit}
                disabled={!answer.trim()}
              >
                <Send className="size-3.5" />
                Reply
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Answered</p>
          )}
        </div>
      </div>
    </div>
  );
}
