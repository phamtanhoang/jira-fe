"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Code,
  List,
  ListOrdered,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RICH_EDITOR } from "@/lib/constants/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MentionList, type MentionItem, type MentionListHandle } from "./mention-list";

export type RichEditorProps = {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minimal?: boolean;
  className?: string;
  autoFocus?: boolean;
  /**
   * Hook for resolving a pasted/dropped file to an external URL. When supplied,
   * the editor uploads images via this function and inserts the returned URL
   * (e.g. attachment storage). When omitted, falls back to inline base64.
   */
  onUploadFile?: (file: File) => Promise<string>;
  /**
   * Members searchable via the @-mention picker. When omitted, the mention
   * extension is dropped entirely so the editor doesn't intercept typed `@`.
   */
  mentionMembers?: MentionItem[];
};

export default function RichEditor({
  content = "",
  onChange,
  placeholder = "",
  editable = true,
  minimal = false,
  className,
  autoFocus = false,
  onUploadFile,
  mentionMembers,
}: RichEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Keep a live ref to mentionMembers so the suggestion query reads fresh
  // data even though the editor extensions are configured once at mount.
  const membersRef = useRef<MentionItem[]>(mentionMembers ?? []);
  useEffect(() => {
    membersRef.current = mentionMembers ?? [];
  }, [mentionMembers]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: RICH_EDITOR.CHAR_LIMIT }),
      Image.configure({ inline: true, allowBase64: true }),
      // Mention extension only when caller wires `mentionMembers`. The
      // extension matches the BE parser's expected markup —
      // `<span data-mention data-id="UUID">@Name</span>` — so triggers fire
      // notifications without extra backend work.
      ...(mentionMembers
        ? [
            Mention.configure({
              HTMLAttributes: {
                "data-mention": "",
                class:
                  "rounded bg-primary/10 px-1 py-0.5 text-primary font-medium cursor-pointer hover:bg-primary/20 transition-colors",
              },
              renderHTML({ options, node }) {
                const id = String(node.attrs.id ?? "");
                const label = String(node.attrs.label ?? id);
                return [
                  "span",
                  {
                    ...options.HTMLAttributes,
                    "data-id": id,
                  },
                  `@${label}`,
                ];
              },
              // The closure captures `membersRef` but only reads `.current`
              // when Tiptap calls `items()` later (during user typing), not
              // during this render. The lint rule can't see through the
              // indirection — disable for this line, the access is safe.
              // eslint-disable-next-line react-hooks/refs
              suggestion: makeMentionSuggestion(() => membersRef.current),
            }),
          ]
        : []),
    ],
    content,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[60px] px-3 py-2",
          minimal && "min-h-[40px]",
        ),
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageNode = view.state.schema.nodes.image;
        if (!imageNode) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;
            insertImageFromFile(view, imageNode, file, onUploadFile);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const dt = (event as DragEvent).dataTransfer;
        if (!dt?.files?.length) return false;

        const imageNode = view.state.schema.nodes.image;
        if (!imageNode) return false;

        const images = Array.from(dt.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (images.length === 0) return false;

        event.preventDefault();
        for (const file of images) {
          insertImageFromFile(view, imageNode, file, onUploadFile);
        }
        return true;
      },
    },
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const isNearLimit = charCount >= RICH_EDITOR.CHAR_WARNING;

  return (
    <div
      className={cn(
        "rounded-md border bg-background transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30",
        className,
      )}
    >
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarSep />

          {!minimal && (
            <>
              <ToolbarButton
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </ToolbarButton>

              <ToolbarSep />
            </>
          )}

          <ToolbarButton
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>

          {!minimal && (
            <>
              <ToolbarSep />
              <ToolbarButton
                onClick={() => {
                  setImageUrl("");
                  setImageDialogOpen(true);
                }}
                title="Insert Image"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </ToolbarButton>
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </ToolbarButton>

            {isNearLimit && (
              <span
                className={cn(
                  "ml-2 text-[10px] tabular-nums",
                  charCount >= RICH_EDITOR.CHAR_LIMIT
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                {charCount}/{RICH_EDITOR.CHAR_LIMIT}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const url = imageUrl.trim();
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
              setImageDialogOpen(false);
            }}
            className="space-y-3"
          >
            <Input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setImageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!imageUrl.trim()}>
                Insert
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suggestion config factory for the @-mention extension. Reads members from
// a ref so the editor (which is configured once at mount) sees fresh data
// when the parent's prop updates. Positions the popup with a fixed-position
// portal via React's createPortal — no tippy.js dependency.
//
// Lifecycle:
//   onStart  — caret hit `@`, mount popup at clientRect
//   onUpdate — query changed or members updated, re-render with new items
//   onKeyDown — forward ↑/↓/Enter to the list (ref's onKeyDown returns true
//               when the key was handled, so the editor lets it through)
//   onExit   — caret left the trigger context, unmount popup
function makeMentionSuggestion(getMembers: () => MentionItem[]) {
  return {
    items: ({ query }: { query: string }) => {
      const q = query.toLowerCase();
      return getMembers()
        .filter((m) =>
          (m.name ?? m.email ?? "").toLowerCase().includes(q),
        )
        .slice(0, 6);
    },
    render: () => {
      let component: ReactRenderer<MentionListHandle> | null = null;
      let container: HTMLDivElement | null = null;

      function mount(rect: DOMRect | null) {
        if (!container) return;
        if (rect) {
          container.style.top = `${rect.bottom + 4}px`;
          container.style.left = `${rect.left}px`;
        }
      }

      return {
        onStart: (props: {
          editor: import("@tiptap/react").Editor;
          clientRect?: (() => DOMRect | null) | null;
          items: MentionItem[];
          command: (item: { id: string; label: string }) => void;
        }) => {
          component = new ReactRenderer(MentionList, {
            props: { items: props.items, command: props.command },
            editor: props.editor,
          });
          container = document.createElement("div");
          container.style.position = "fixed";
          container.style.zIndex = "60";
          container.appendChild(component.element as Node);
          document.body.appendChild(container);
          mount(props.clientRect?.() ?? null);
        },
        onUpdate: (props: {
          clientRect?: (() => DOMRect | null) | null;
          items: MentionItem[];
          command: (item: { id: string; label: string }) => void;
        }) => {
          component?.updateProps({
            items: props.items,
            command: props.command,
          });
          mount(props.clientRect?.() ?? null);
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === "Escape") {
            return true;
          }
          return component?.ref?.onKeyDown(props.event) ?? false;
        },
        onExit: () => {
          container?.remove();
          component?.destroy();
          container = null;
          component = null;
        },
      };
    },
  };
}

// Inserts a pasted/dropped file as an <img>. If onUploadFile is provided we
// upload first and use the returned URL; otherwise we fall back to a base64
// data URL for editors with no upload context (e.g. settings forms).
function insertImageFromFile(
  view: import("@tiptap/pm/view").EditorView,
  imageNode: import("@tiptap/pm/model").NodeType,
  file: File,
  onUploadFile?: (file: File) => Promise<string>,
) {
  if (onUploadFile) {
    onUploadFile(file)
      .then((src) => {
        if (!src) return;
        view.dispatch(view.state.tr.replaceSelectionWith(imageNode.create({ src })));
      })
      .catch(() => {
        // Upload failed — surface via toast at the call site; here we no-op.
      });
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result as string;
    view.dispatch(view.state.tr.replaceSelectionWith(imageNode.create({ src })));
  };
  reader.readAsDataURL(file);
}

// ─── Toolbar helpers ──────────────────────────────────

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="mx-0.5 h-4 w-px bg-border" />;
}
