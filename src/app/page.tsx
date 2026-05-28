"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Search } from "lucide-react";
import { useRef } from "react";

const EXAMPLE_QUERIES = [
  {
    label: "AI startup engineers",
    query:
      "Engineers from top colleges with internship experience at high growth AI startups like Vercel, Ramp, or Cognition",
  },
  {
    label: "Enterprise sales leaders",
    query:
      "Someone with experience to build out an enterprise sales team, perhaps a significant role at ServiceNow or Splunk",
  },
  {
    label: "AI strategy in finance",
    query:
      "People at investment banks or consulting firms in charge of AI strategy",
  },
  {
    label: "Former founders",
    query:
      "Former startup founders who went through a top accelerator but their company phased out",
  },
  {
    label: "Acquihire talent",
    query:
      "AI companies that were acquihired by larger players where engineers may want something new",
  },
  {
    label: "ML infrastructure",
    query:
      "Machine learning infrastructure engineers with experience at companies like Databricks, Snowflake, or Weights & Biases",
  },
];

export default function Home() {
  const router = useRouter();

  const startChat = async (text: string) => {
    if (!text.trim()) return;
    const title = text.slice(0, 60);
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const chat = await res.json();
    // Navigate with the initial message as a query param
    router.push(`/chat/${chat.id}?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 mb-2">
            <Search className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Context Recruiter
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Describe who you&apos;re looking for and the agent will search
            across 700M+ profiles to find matching candidates.
          </p>
        </div>

        <QueryInput onSubmit={startChat} />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            Try an example
          </p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLE_QUERIES.map((example, i) => (
              <button
                key={i}
                onClick={() => startChat(example.query)}
                className="group text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent transition-all duration-150"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                  {example.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {example.query}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const value = textareaRef.current?.value;
    if (value?.trim()) {
      onSubmit(value);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder="Describe who you're looking for..."
        autoFocus
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
        className="absolute right-2 bottom-2"
      >
        <ArrowUp className="size-3.5" />
      </Button>
    </div>
  );
}
