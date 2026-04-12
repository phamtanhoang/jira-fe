"use client";

import { useState } from "react";
import { Send, Pencil, Trash2 } from "lucide-react";
import { getInitials, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from "../hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function IssueComments({
  issueId,
  currentUser,
}: {
  issueId: string;
  currentUser: { id: string; name: string | null };
}) {
  const { t } = useAppStore();
  const { data: comments } = useComments(issueId);
  const { mutate: addComment, isPending: commenting } = useAddComment(issueId);
  const { mutate: updateComment } = useUpdateComment(issueId);
  const { mutate: deleteComment } = useDeleteComment(issueId);

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addComment({ content: text.trim() }, { onSuccess: () => setText("") });
  }

  return (
    <div>
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <Avatar className="mt-1 h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px]">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={t("issue.addComment")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="mb-2 resize-none text-sm"
            />
            {text.trim() && (
              <Button type="submit" size="sm" disabled={commenting}>
                <Send className="mr-1.5 h-3 w-3" />{t("common.save")}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Comment list */}
      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="group flex gap-3">
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {getInitials(comment.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-baseline gap-2">
                <span className="text-[13px] font-semibold">{comment.author.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTime(comment.createdAt)}
                </span>
                {comment.authorId === currentUser.id && (
                  <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => { setEditingId(comment.id); setEditDraft(comment.content); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={2}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="xs" onClick={() => { updateComment({ commentId: comment.id, content: editDraft.trim() }); setEditingId(null); }}>
                      {t("common.save")}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>{t("common.cancel")}</Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                  {comment.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
