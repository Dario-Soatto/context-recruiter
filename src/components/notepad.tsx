"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StickyNote, X, GripHorizontal, Plus, Trash2 } from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
};

export function NotepadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <StickyNote className="size-3.5" />
        Notepad
      </Button>
      {isOpen && <NotepadWindow onClose={() => setIsOpen(false)} />}
    </>
  );
}

function NotepadWindow({ onClose }: { onClose: () => void }) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 380 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const saveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load notes on mount
  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data: Note[]) => {
        if (data.length === 0) {
          // Create a default note
          fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled", content: "" }),
          })
            .then((res) => res.json())
            .then((note: Note) => {
              setNotes([note]);
              setActiveId(note.id);
              setLoaded(true);
            });
        } else {
          setNotes(data);
          setActiveId(data[0].id);
          setLoaded(true);
        }
      });
  }, []);

  const activeNote = notes.find((n) => n.id === activeId) ?? notes[0];

  const addNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "" }),
    });
    const note: Note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  };

  const deleteNote = async (id: string) => {
    // Clear any pending save
    const timer = saveTimers.current.get(id);
    if (timer) clearTimeout(timer);
    saveTimers.current.delete(id);

    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (next.length === 0) {
        // Create a fresh note
        addNote();
        return [];
      }
      if (activeId === id) {
        setActiveId(next[0].id);
      }
      return next;
    });
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );

    // Debounced save
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);
    saveTimers.current.set(
      id,
      setTimeout(() => {
        fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        saveTimers.current.delete(id);
      }, 500)
    );
  };

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        setPosition({
          x: Math.max(0, e.clientX - startX),
          y: Math.max(0, e.clientY - startY),
        });
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [position]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;
      const startHeight = size.height;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        setSize({
          width: Math.max(400, startWidth + (e.clientX - startX)),
          height: Math.max(250, startHeight + (e.clientY - startY)),
        });
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [size]
  );

  if (!loaded) return null;

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      className="fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-xl overflow-hidden"
    >
      {/* Title bar */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 cursor-grab active:cursor-grabbing shrink-0 select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="size-3.5 text-muted-foreground/50" />
          <span className="text-xs font-medium text-muted-foreground">
            Notepad
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Notes sidebar */}
        <div className="w-[160px] border-r border-border flex flex-col shrink-0 bg-muted/20">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </span>
            <button
              onClick={addNote}
              className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
              title="New note"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveId(note.id)}
                className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors ${
                  note.id === activeId
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-xs truncate flex-1 min-w-0">
                  {note.title || "Untitled"}
                </span>
                {notes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all shrink-0 ml-1"
                    title="Delete note"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {activeNote && (
          <div className="flex-1 flex flex-col min-w-0">
            <input
              value={activeNote.title}
              onChange={(e) =>
                updateNote(activeNote.id, { title: e.target.value })
              }
              placeholder="Note title..."
              className="px-3 py-2 text-sm font-medium bg-transparent border-b border-border focus:outline-none placeholder:text-muted-foreground/40"
            />
            <textarea
              value={activeNote.content}
              onChange={(e) =>
                updateNote(activeNote.id, { content: e.target.value })
              }
              placeholder="Type your notes here..."
              className="flex-1 w-full p-3 text-sm leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none font-sans"
            />
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
      >
        <svg
          className="absolute bottom-1 right-1 text-muted-foreground/30"
          width="8"
          height="8"
          viewBox="0 0 8 8"
        >
          <path
            d="M7 1L1 7M7 4L4 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
