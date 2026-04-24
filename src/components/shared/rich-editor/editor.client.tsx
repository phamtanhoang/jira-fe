"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
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

export type RichEditorProps = {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minimal?: boolean;
  className?: string;
  autoFocus?: boolean;
};

export default function RichEditor({
  content = "",
  onChange,
  placeholder = "",
  editable = true,
  minimal = false,
  className,
  autoFocus = false,
}: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: RICH_EDITOR.CHAR_LIMIT }),
      Image.configure({ inline: true, allowBase64: true }),
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

            const reader = new FileReader();
            reader.onload = () => {
              const src = reader.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(imageNode.create({ src })),
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
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
                  const url = window.prompt("Image URL:");
                  if (url) editor.chain().focus().setImage({ src: url }).run();
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
    </div>
  );
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
