"use client";

import { useState } from "react";
import { Send, Pencil, Trash2, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/use-app-store";
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from "../hooks";
import { issuesApi } from "../api";
import { RichEditor, RichContent } from "@/components/shared/rich-editor";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/ui/user-avatar";

export function IssueComments({
  issueId,
  currentUser,
  members,
}: {
  issueId: string;
  currentUser: { id: string; name: string | null };
  members?: { id: string; name: string | null; image: string | null; email?: string }[];
}) {
  const { t } = useAppStore();
  const { data: comments } = useComments(issueId);
  const { mutate: addComment, isPending: commenting } = useAddComment(issueId);
  const { mutate: updateComment } = useUpdateComment(issueId);
  const { mutate: deleteComment } = useDeleteComment(issueId);

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function uploadInlineImage(file: File): Promise<string> {
    const r = await issuesApi.uploadAttachments(issueId, [file]);
    const att = r.attachments?.[0];
    return att?.signedUrl ?? att?.fileUrl ?? "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || text === "<p></p>") return;
    addComment({ content: text }, { onSuccess: () => setText("") });
  }

  return (
    <div>
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <UserAvatar
            user={currentUser}
            className="mt-1 h-7 w-7 shrink-0"
            fallbackClassName="text-[10px]"
          />
          <div className="flex-1">
            <RichEditor
              content={text}
              onChange={setText}
              placeholder={t("issue.addComment")}
              minimal
              className="mb-2"
              mentionMembers={members}
              onUploadFile={uploadInlineImage}
            />
            {text && text !== "<p></p>" && (
              <Button type="submit" size="sm" disabled={commenting}>
                {commenting ? <Spinner className="mr-1.5 h-3 w-3" /> : <Send className="mr-1.5 h-3 w-3" />}
                {t("common.save")}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Empty state */}
      {comments && comments.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 py-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          <p className="text-[12px] text-muted-foreground/60">{t("issue.noComments")}</p>
        </div>
      )}

      {/* Comment list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments?.map((comment) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="group flex gap-3"
            >
              <UserAvatar
                user={comment.author}
                className="mt-0.5 h-7 w-7 shrink-0"
                fallbackClassName="text-[10px]"
              />
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
                    <RichEditor
                      content={editDraft}
                      onChange={setEditDraft}
                      minimal
                      autoFocus
                      mentionMembers={members}
                      onUploadFile={uploadInlineImage}
                    />
                    <div className="flex gap-2">
                      <Button size="xs" onClick={() => { updateComment({ commentId: comment.id, content: editDraft }); setEditingId(null); }}>
                        {t("common.save")}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>{t("common.cancel")}</Button>
                    </div>
                  </div>
                ) : (
                  <RichContent html={comment.content} className="text-[13px] text-foreground/80" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
