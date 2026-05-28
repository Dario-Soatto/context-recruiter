"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type CandidateExperience = {
  company?: string;
  positions?: Array<{
    title?: string;
    department?: string;
    seniorityScore?: number;
    description?: string;
  }>;
  startDate?: string;
  endDate?: string;
};

export type CandidateEducation = {
  school?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
};

export type CandidateEnrichment = {
  headline?: string | null;
  about?: string | null;
  skills?: string[];
  experience?: CandidateExperience[];
  education?: CandidateEducation[];
};

export type Candidate = {
  id: string; // Aviato ID
  fullName: string;
  location: string;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  enrichment: CandidateEnrichment | null;
};

export type SavedCandidate = Candidate & {
  dbId: string;
};

type CandidatesContextType = {
  candidates: Candidate[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addCandidates: (chatId: string, candidates: Candidate[]) => void;
  removeCandidate: (id: string) => void;
  clearCandidates: () => void;
  setActiveChatId: (chatId: string | null) => void;
  savedCandidates: SavedCandidate[];
  saveCandidate: (candidate: Candidate) => void;
  unsaveCandidate: (id: string) => void;
  isSaved: (id: string) => boolean;
};

const CandidatesContext = createContext<CandidatesContextType | null>(null);

export function CandidatesProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [activeChatId, _setActiveChatId] = useState<string | null>(null);

  // Load saved candidates from database on mount
  useEffect(() => {
    fetch("/api/saved-candidates")
      .then((res) => res.json())
      .then(
        (
          rows: Array<{
            id: string;
            aviatoId: string;
            fullName: string;
            location: string | null;
            linkedinUrl: string | null;
            twitterUrl: string | null;
            enrichment: CandidateEnrichment | null;
          }>
        ) => {
          setSavedCandidates(
            rows.map((row) => ({
              dbId: row.id,
              id: row.aviatoId,
              fullName: row.fullName,
              location: row.location ?? "",
              linkedinUrl: row.linkedinUrl,
              twitterUrl: row.twitterUrl,
              enrichment: row.enrichment,
            }))
          );
        }
      );
  }, []);

  // Load chat candidates when active chat changes
  const setActiveChatId = useCallback((chatId: string | null) => {
    _setActiveChatId(chatId);
    if (chatId) {
      fetch(`/api/chats/${chatId}/candidates`)
        .then((res) => res.json())
        .then(
          (
            rows: Array<{
              aviatoId: string;
              fullName: string;
              location: string | null;
              linkedinUrl: string | null;
              twitterUrl: string | null;
              enrichment: CandidateEnrichment | null;
            }>
          ) => {
            const loaded = rows.map((row) => ({
              id: row.aviatoId,
              fullName: row.fullName,
              location: row.location ?? "",
              linkedinUrl: row.linkedinUrl,
              twitterUrl: row.twitterUrl,
              enrichment: row.enrichment as CandidateEnrichment | null,
            }));
            setCandidates(loaded);
            if (loaded.length > 0) setIsOpen(true);
          }
        );
    } else {
      setCandidates([]);
    }
  }, []);

  const addCandidates = useCallback(
    (chatId: string, newCandidates: Candidate[]) => {
      setCandidates((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const toAdd = newCandidates.filter((c) => !existingIds.has(c.id));
        return [...prev, ...toAdd];
      });
      setIsOpen(true);

      // Persist to DB
      fetch(`/api/chats/${chatId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: newCandidates.map((c) => ({
            aviatoId: c.id,
            fullName: c.fullName,
            location: c.location,
            linkedinUrl: c.linkedinUrl,
            twitterUrl: c.twitterUrl,
            enrichment: c.enrichment,
          })),
        }),
      });
    },
    []
  );

  const removeCandidate = useCallback((id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCandidates = useCallback(() => {
    setCandidates([]);
    setIsOpen(false);
  }, []);

  const saveCandidate = useCallback(
    async (candidate: Candidate) => {
      if (savedCandidates.some((c) => c.id === candidate.id)) return;

      const res = await fetch("/api/saved-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aviatoId: candidate.id,
          fullName: candidate.fullName,
          location: candidate.location,
          linkedinUrl: candidate.linkedinUrl,
          twitterUrl: candidate.twitterUrl,
          enrichment: candidate.enrichment,
        }),
      });
      const row = await res.json();

      setSavedCandidates((prev) => [
        ...prev,
        { ...candidate, dbId: row.id },
      ]);
    },
    [savedCandidates]
  );

  const unsaveCandidate = useCallback(
    async (id: string) => {
      const saved = savedCandidates.find((c) => c.id === id);
      if (!saved) return;

      await fetch(`/api/saved-candidates/${saved.dbId}`, {
        method: "DELETE",
      });

      setSavedCandidates((prev) => prev.filter((c) => c.id !== id));
    },
    [savedCandidates]
  );

  const isSaved = useCallback(
    (id: string) => savedCandidates.some((c) => c.id === id),
    [savedCandidates]
  );

  return (
    <CandidatesContext.Provider
      value={{
        candidates,
        isOpen,
        setIsOpen,
        addCandidates,
        removeCandidate,
        clearCandidates,
        setActiveChatId,
        savedCandidates,
        saveCandidate,
        unsaveCandidate,
        isSaved,
      }}
    >
      {children}
    </CandidatesContext.Provider>
  );
}

export function useCandidates() {
  const ctx = useContext(CandidatesContext);
  if (!ctx) throw new Error("useCandidates must be used within CandidatesProvider");
  return ctx;
}
