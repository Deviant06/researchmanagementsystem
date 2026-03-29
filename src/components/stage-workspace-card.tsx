"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CommentThread } from "@/components/comment-thread";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { TaskList } from "@/components/task-list";
import { requestJson } from "@/lib/client";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { EnrichedStage, Role } from "@/lib/types";

interface StageWorkspaceCardProps {
  groupId: string;
  groupName: string;
  role: Role;
  stage: EnrichedStage;
}

export function StageWorkspaceCard({
  groupId,
  groupName,
  role,
  stage
}: StageWorkspaceCardProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySection, setBusySection] = useState<string | null>(null);

  async function handleSubmission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusySection("submission");
    setFeedback(null);
    setError(null);

    try {
      await requestJson(
        `/api/groups/${groupId}/stages/${stage.stageKey}/submissions`,
        {
          method: "POST",
          body: new FormData(event.currentTarget)
        }
      );

      setFeedback("Submission uploaded successfully.");
      event.currentTarget.reset();
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Submission failed."
      );
    } finally {
      setBusySection(null);
    }
  }

  async function handleStageUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusySection("status");
    setFeedback(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const dueDateValue = String(formData.get("dueDate") ?? "");

    try {
      await requestJson(`/api/groups/${groupId}/stages/${stage.stageKey}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: String(formData.get("status") ?? stage.status),
          dueDate: dueDateValue
            ? new Date(`${dueDateValue}T00:00:00`).toISOString()
            : undefined
        })
      });

      setFeedback("Stage updated.");
      router.refresh();
    } catch (stageError) {
      setError(stageError instanceof Error ? stageError.message : "Update failed.");
    } finally {
      setBusySection(null);
    }
  }

  async function handleComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusySection("comment");
    setFeedback(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await requestJson(`/api/groups/${groupId}/stages/${stage.stageKey}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          section: String(formData.get("section") ?? ""),
          category: String(formData.get("category") ?? "MINOR_REVISION"),
          text: String(formData.get("text") ?? "")
        })
      });

      setFeedback("Feedback saved and task created.");
      event.currentTarget.reset();
      router.refresh();
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Save failed.");
    } finally {
      setBusySection(null);
    }
  }

  return (
    <article className="surface-card stage-panel">
      <div className="stage-panel-head">
        <div className="stack-xs">
          <p className="eyebrow">{groupName}</p>
          <h3>{stage.label}</h3>
          <p className="muted-copy">
            Due {formatDate(stage.dueDate)} • Last submission{" "}
            {formatDateTime(stage.lastSubmissionAt)}
          </p>
        </div>
        <div className="stack-sm stage-panel-status">
          <StatusBadge status={stage.status} />
          {stage.isLate ? <span className="badge badge-red">Late</span> : null}
        </div>
      </div>

      <ProgressBar
        label="Stage completion score"
        tone={role === "ADMIN" ? "blue" : "green"}
        value={stage.progressScore}
      />

      {feedback ? <p className="form-success">{feedback}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {role === "ADMIN" ? (
        <form className="card-form-grid" onSubmit={handleStageUpdate}>
          <label className="field">
            <span>Status</span>
            <select defaultValue={stage.status} name="status">
              <option value="NOT_STARTED">Not Started</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVISED">Revision Needed</option>
              <option value="APPROVED">Approved</option>
            </select>
          </label>

          <label className="field">
            <span>Due date</span>
            <input
              defaultValue={stage.dueDate.slice(0, 10)}
              name="dueDate"
              type="date"
            />
          </label>

          <div className="form-actions">
            <button
              className="button button-secondary"
              disabled={busySection === "status"}
              type="submit"
            >
              {busySection === "status" ? "Saving..." : "Update Stage"}
            </button>
          </div>
        </form>
      ) : (
        <form className="stack-sm" onSubmit={handleSubmission}>
          <label className="field">
            <span>Submission notes / text input</span>
            <textarea
              name="content"
              placeholder="Paste your latest draft notes, summary, or chapter content here..."
              rows={4}
            />
          </label>

          <label className="field">
            <span>Upload file (PDF or DOCX)</span>
            <input accept=".pdf,.docx" name="file" type="file" />
          </label>

          <div className="form-actions">
            <button
              className="button button-primary"
              disabled={busySection === "submission"}
              type="submit"
            >
              {busySection === "submission" ? "Uploading..." : "Submit New Version"}
            </button>
          </div>
        </form>
      )}

      <div className="panel-divider" />

      <section className="stack-sm">
        <div className="section-heading">
          <div>
            <h4>{role === "ADMIN" ? "Submission History" : "Your Submission History"}</h4>
            <p>
              {role === "ADMIN"
                ? "Every version is preserved with timestamps and uploader details."
                : "Your own uploads are preserved with version numbers and timestamps."}
            </p>
          </div>
        </div>

        <div className="stack-md">
          {stage.submissions.length === 0 ? (
            <p className="muted-copy">No submissions yet for this stage.</p>
          ) : (
            stage.submissions.map((submission) => (
              <article className="version-card" key={submission.id}>
                <div className="inline-cluster inline-cluster-spread">
                  <div className="stack-xs">
                    <strong>Version {submission.version}</strong>
                    <p className="muted-copy">
                      {submission.uploaderName} • {formatDateTime(submission.createdAt)}
                    </p>
                  </div>
                  {submission.fileName ? (
                    <a
                      className="button button-secondary"
                      href={`/api/files/submissions/${submission.id}`}
                    >
                      Download {submission.fileName}
                    </a>
                  ) : null}
                </div>
                {submission.content ? <p>{submission.content}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <div className="panel-divider" />

      <section className="stack-sm">
        <div className="section-heading">
          <div>
            <h4>Structured Feedback</h4>
            <p>Comments are organized by section and support threaded replies.</p>
          </div>
        </div>
        <CommentThread comments={stage.comments} role={role} />
      </section>

      {role === "ADMIN" ? (
        <>
          <div className="panel-divider" />
          <section className="stack-sm">
            <div className="section-heading">
              <div>
                <h4>Add Teacher Feedback</h4>
                <p>Each comment automatically creates a linked revision task.</p>
              </div>
            </div>

            <form className="stack-sm" onSubmit={handleComment}>
              <div className="card-form-grid">
                <label className="field">
                  <span>Section</span>
                  <input
                    name="section"
                    placeholder="RRL, Methodology, Synthesis..."
                    required
                    type="text"
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select defaultValue="MINOR_REVISION" name="category">
                    <option value="MAJOR_REVISION">Major Revision</option>
                    <option value="MINOR_REVISION">Minor Revision</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Comment</span>
                <textarea
                  name="text"
                  placeholder="Write clear, actionable guidance for the student group..."
                  required
                  rows={4}
                />
              </label>

              <div className="form-actions">
                <button
                  className="button button-primary"
                  disabled={busySection === "comment"}
                  type="submit"
                >
                  {busySection === "comment" ? "Saving..." : "Save Feedback"}
                </button>
              </div>
            </form>
          </section>
        </>
      ) : null}

      <div className="panel-divider" />

      <section className="stack-sm">
        <div className="section-heading">
          <div>
            <h4>Revision Task Tracker</h4>
            <p>Each checklist item is tied to a teacher comment for this stage.</p>
          </div>
        </div>
        <TaskList role={role} tasks={stage.tasks} />
      </section>
    </article>
  );
}
