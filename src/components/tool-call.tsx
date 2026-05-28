"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Building2,
  Globe,
  UserSearch,
  GitMerge,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Briefcase,
} from "lucide-react";

interface ToolCallProps {
  toolName: string;
  state: string;
  input: unknown;
  output: unknown;
  errorText?: string;
}

const TOOL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  person_search: { label: "Searching people", icon: Users },
  company_search: { label: "Searching companies", icon: Building2 },
  person_enrich: { label: "Enriching person", icon: UserSearch },
  company_enrich: { label: "Enriching company", icon: Building2 },
  company_employees: { label: "Listing employees", icon: Briefcase },
  company_acquisitions: { label: "Finding acquisitions", icon: GitMerge },
  web_search: { label: "Searching the web", icon: Globe },
};

function getResultSummary(
  toolName: string,
  output: Record<string, unknown>
): string | null {
  if (!output) return null;
  if (output.error) return String(output.error).slice(0, 80);
  if (
    toolName === "person_search" ||
    toolName === "company_search"
  ) {
    return `${output.returnedCount} of ${output.totalCount} results`;
  }
  if (toolName === "web_search") {
    return `${output.resultCount} results`;
  }
  if (toolName === "company_employees") {
    return `${output.totalResults} employees`;
  }
  if (toolName === "company_acquisitions") {
    return `${output.totalResults} acquisitions`;
  }
  return null;
}

function getSearchDescription(
  toolName: string,
  input: Record<string, unknown>
): string | null {
  if (toolName === "web_search") {
    return (input.objective as string) ?? null;
  }
  if (toolName === "person_enrich" || toolName === "company_enrich") {
    return (input.id as string) ?? (input.linkedinURL as string) ?? null;
  }
  return null;
}

export function ToolCall({
  toolName,
  state,
  input,
  output,
  errorText,
}: ToolCallProps) {
  const [open, setOpen] = useState(false);
  const config = TOOL_CONFIG[toolName] ?? {
    label: toolName,
    icon: Globe,
  };
  const Icon = config.icon;

  const isRunning = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";
  const description = getSearchDescription(
    toolName,
    (input ?? {}) as Record<string, unknown>
  );
  const summary = isDone
    ? getResultSummary(toolName, output as Record<string, unknown>)
    : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex items-center gap-2 w-full py-1.5 text-left text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <div className="flex items-center justify-center size-5 rounded-md bg-muted">
          {isRunning ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : isError ? (
            <AlertCircle className="size-3 text-destructive" />
          ) : isDone ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Icon className="size-3" />
          )}
        </div>
        <span className="font-medium">
          {isRunning ? config.label + "..." : config.label}
        </span>
        {description && (
          <span className="truncate max-w-[200px] text-xs text-muted-foreground/70">
            {description}
          </span>
        )}
        {summary && (
          <span className="text-xs text-muted-foreground/70 ml-auto mr-1">
            {summary}
          </span>
        )}
        <ChevronRight
          className={`size-3.5 text-muted-foreground/50 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-7 mt-1 mb-2 space-y-2">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              Input
            </p>
            <pre className="text-xs bg-muted/50 text-muted-foreground p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {isDone && output != null ? (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Output
              </p>
              <pre className="text-xs bg-muted/50 text-muted-foreground p-3 rounded-lg overflow-x-auto max-h-72 overflow-y-auto font-mono leading-relaxed">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          ) : null}
          {errorText ? (
            <div>
              <p className="text-[11px] font-medium text-destructive mb-1 uppercase tracking-wider">
                Error
              </p>
              <pre className="text-xs bg-destructive/5 text-destructive p-3 rounded-lg font-mono">
                {errorText}
              </pre>
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
