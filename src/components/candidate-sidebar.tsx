"use client";

import { useState, useRef, useCallback } from "react";
import { useCandidates, type Candidate } from "@/lib/candidates";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  MapPin,
  Users,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Trash2,
} from "lucide-react";
import { CandidateProfile } from "./candidate-profile";

export function CandidateSidebar() {
  const { candidates, isOpen, setIsOpen, clearCandidates } = useCandidates();
  const [width, setWidth] = useState(420);
  const isDragging = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX - e.clientX;
      const newWidth = Math.max(320, Math.min(800, startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [width]);

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      style={{ width }}
      className="border-l border-border bg-background flex flex-col h-screen shrink-0 relative"
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-10"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Candidates</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
            {candidates.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={clearCandidates} title="Clear all">
            <Trash2 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setIsOpen(false)}>
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Candidate list */}
      <div className="flex-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <Users className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No candidates yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Search for people and surface candidates to see them here
            </p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false);
  const { removeCandidate, saveCandidate, unsaveCandidate, isSaved } = useCandidates();
  const saved = isSaved(candidate.id);
  const enrichment = candidate.enrichment;
  const currentExp = enrichment?.experience?.[0];
  const currentTitle = currentExp?.positions?.[0]?.title;
  const currentCompany = currentExp?.company;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-start px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors">
        <CollapsibleTrigger className="flex items-start gap-3 flex-1 min-w-0 text-left cursor-pointer">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {candidate.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">
                {candidate.fullName}
              </span>
              <ChevronDown
                className={`size-3 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>

            {enrichment?.headline ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {enrichment.headline}
              </p>
            ) : currentTitle && currentCompany ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentTitle} at {currentCompany}
              </p>
            ) : null}

            {candidate.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="size-2.5 text-muted-foreground/60 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60 truncate">
                  {candidate.location}
                </span>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <div className="flex flex-col gap-0.5 ml-2 mt-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (saved) {
                unsaveCandidate(candidate.id);
              } else {
                saveCandidate(candidate);
              }
            }}
            className={`p-1 rounded-md transition-colors ${
              saved
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-primary hover:bg-muted"
            }`}
            title={saved ? "Unsave candidate" : "Save candidate"}
          >
            {saved ? (
              <BookmarkCheck className="size-3.5" />
            ) : (
              <Bookmark className="size-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCandidate(candidate.id);
            }}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
            title="Remove candidate"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <CollapsibleContent>
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <CandidateProfile candidate={candidate} compact />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
