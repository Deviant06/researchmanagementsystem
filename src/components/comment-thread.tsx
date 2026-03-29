"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestJson } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";
import type { EnrichedComment, Role } from "@/lib/types";
import { CategoryBadge } from "@/components/status-badge";

interface CommentThreadProps {
  comments: EnrichedComment[];
  role: Role;
}

export function CommentThread({ comments, role }: CommentThreadProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleReply(
    event: React.FormEvent<HTMLFormElement>,
    commentId: string
  ) {
    event.preventDefault();
    setBusyId(commentId);
    setFeedback(null);

    const formData = new FormData(event.currentTarget);

    try {
      await requestJson(`/api/comments/${commentId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: String(formData.get("text") ?? "")
        })
      });

      setFeedback("Reply posted.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Reply failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddress(commentId: string) {
    setBusyId(commentId);
    setFeedback(null);

    try {
      await requestJson(`/api/comments/${commentId}/address`, {
        method: "POST"
      });

      setFeedback("Comment marked as addressed.");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack-md">
      {feedback ? <p className="form-success">{feedback}</p> : null}

      {comments.length === 0 ? (
        <p className="muted-copy">No teacher comments yet.</p>
      ) : (
        comments.map((comment) => (
          <article className="thread-card" key={comment.id}>
            <div className="thread-head">
              <div className="stack-xs">
                <div className="inline-cluster">
                  <strong>{comment.section}</strong>
                  <CategoryBadge category={comment.category} />
                  {comment.addressedAt ? (
                    <span className="badge badge-green">Addressed</span>
                  ) : (
                    <span className="badge badge-red">Open</span>
                  )}
                </div>
                <p className="muted-copy">
                  {comment.createdByName} • {formatDateTime(comment.createdAt)}
                </p>
              </div>
            </div>

            <p>{comment.text}</p>

            {comment.replies.length > 0 ? (
              <div className="reply-list">
                {comment.replies.map((reply) => (
                  <div className="reply-card" key={reply.id}>
                    <strong>{reply.userName}</strong>
                    <p>{reply.text}</p>
                    <span>{formatDateTime(reply.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <form className="inline-form" onSubmit={(event) => handleReply(event, comment.id)}>
              <textarea
                name="text"
                placeholder={
                  role === "ADMIN"
                    ? "Add a follow-up clarification..."
                    : "Reply with your update or question..."
                }
                required
                rows={2}
              />
              <div className="inline-actions">
                {role === "STUDENT" && !comment.addressedAt ? (
                  <button
                    className="button button-secondary"
                    disabled={busyId === comment.id}
                    onClick={() => handleAddress(comment.id)}
                    type="button"
                  >
                    Mark Addressed
                  </button>
                ) : null}
                <button
                  className="button button-primary"
                  disabled={busyId === comment.id}
                  type="submit"
                >
                  {busyId === comment.id ? "Saving..." : "Reply"}
                </button>
              </div>
            </form>
          </article>
        ))
      )}
    </div>
  );
}
