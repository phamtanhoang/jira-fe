"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { UserAvatar } from "@/components/ui/user-avatar";

export type MentionItem = {
  id: string;
  name: string | null;
  email?: string;
  image?: string | null;
};

export type MentionListHandle = {
  /** Returns true if the key was handled (caller should preventDefault). */
  onKeyDown: (event: KeyboardEvent) => boolean;
};

type Props = {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
};

/**
 * Suggestion popup rendered by Tiptap's mention extension.
 *
 * Imperative API (via ref) lets the parent forward keyDown events from the
 * editor into our list — that's how Tiptap's suggestion plugin keeps the
 * caret in the editor while the user navigates the dropdown with ↑/↓/Enter.
 */
export const MentionList = forwardRef<MentionListHandle, Props>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Clamp the highlight to the current item count without spawning an
    // effect — derive on render so list shrinks (after typing more chars)
    // don't trigger a cascading re-render via setState-in-effect.
    const safeIndex = items.length === 0 ? 0 : selectedIndex % items.length;

    function selectItem(index: number) {
      const item = items[index];
      if (!item) return;
      command({ id: item.id, label: item.name ?? item.email ?? "user" });
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (items.length === 0) return false;
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(safeIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-lg border bg-popover p-2 text-[12px] text-muted-foreground shadow-md">
          No matching members
        </div>
      );
    }

    return (
      <div className="max-h-64 w-64 overflow-auto rounded-lg border bg-popover p-1 shadow-md">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] ${
              index === safeIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted/50"
            }`}
          >
            <UserAvatar
              user={item}
              className="h-5 w-5"
              fallbackClassName="text-[9px]"
            />
            <span className="min-w-0 flex-1 truncate">
              {item.name ?? item.email}
            </span>
          </button>
        ))}
      </div>
    );
  },
);
