"use client";

import { useState } from "react";
import { useCandidates } from "@/lib/candidates";
import { Button } from "@/components/ui/button";
import { CandidateProfile } from "./candidate-profile";
import {
  Bookmark,
  X,
  MapPin,
  BookmarkX,
} from "lucide-react";

export function SavedCandidatesButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { savedCandidates } = useCandidates();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Bookmark className="size-3.5" />
        Saved
        {savedCandidates.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md ml-1">
            {savedCandidates.length}
          </span>
        )}
      </Button>
      {isOpen && <SavedCandidatesModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function SavedCandidatesModal({ onClose }: { onClose: () => void }) {
  const { savedCandidates, unsaveCandidate } = useCandidates();
  const [activeId, setActiveId] = useState<string | null>(
    savedCandidates[0]?.id ?? null
  );

  const activeCandidate = savedCandidates.find((c) => c.id === activeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[900px] max-w-[90vw] h-[600px] max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl flex overflow-hidden">
        {/* Left sidebar — candidate list */}
        <div className="w-[280px] border-r border-border flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Saved Candidates</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {savedCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <Bookmark className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No saved candidates yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Click the bookmark icon on a candidate to save them
                </p>
              </div>
            ) : (
              savedCandidates.map((candidate) => {
                const isActive = candidate.id === activeId;
                const currentExp = candidate.enrichment?.experience?.[0];
                const currentTitle = currentExp?.positions?.[0]?.title;
                const currentCompany = currentExp?.company;

                return (
                  <div
                    key={candidate.id}
                    onClick={() => setActiveId(candidate.id)}
                    className={`group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-border transition-colors ${
                      isActive
                        ? "bg-primary/5"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {candidate.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {candidate.fullName}
                      </p>
                      {(candidate.enrichment?.headline || (currentTitle && currentCompany)) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {candidate.enrichment?.headline ||
                            `${currentTitle} at ${currentCompany}`}
                        </p>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="size-2.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-[11px] text-muted-foreground/60 truncate">
                            {candidate.location}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveCandidate(candidate.id);
                        if (isActive) {
                          const remaining = savedCandidates.filter(
                            (c) => c.id !== candidate.id
                          );
                          setActiveId(remaining[0]?.id ?? null);
                        }
                      }}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
                      title="Remove from saved"
                    >
                      <BookmarkX className="size-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — full profile */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeCandidate ? (
            <CandidateProfile candidate={activeCandidate} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-muted-foreground">
                {savedCandidates.length > 0
                  ? "Select a candidate to view their profile"
                  : "Save candidates to view them here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
