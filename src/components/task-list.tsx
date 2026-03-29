"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestJson } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";
import type { EnrichedTask, Role } from "@/lib/types";

interface TaskListProps {
  tasks: EnrichedTask[];
  role: Role;
}

export function TaskList({ tasks, role }: TaskListProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
    taskId: string
  ) {
    event.preventDefault();
    setBusyId(taskId);
    setFeedback(null);

    const formData = new FormData(event.currentTarget);

    try {
      await requestJson(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: String(formData.get("status") ?? "PENDING"),
          studentResponse: String(formData.get("studentResponse") ?? "")
        })
      });

      setFeedback("Task updated.");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Task update failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="stack-md">
      {feedback ? <p className="form-success">{feedback}</p> : null}

      {tasks.length === 0 ? (
        <p className="muted-copy">No revision tasks linked to this stage.</p>
      ) : (
        tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="inline-cluster inline-cluster-spread">
              <div className="stack-xs">
                <strong>{task.comment?.section ?? "Revision Task"}</strong>
                <p>{task.description}</p>
              </div>
              <span
                className={`badge ${task.status === "COMPLETED" ? "badge-green" : "badge-red"}`}
              >
                {task.status === "COMPLETED" ? "Completed" : "Pending"}
              </span>
            </div>

            <p className="muted-copy">Updated {formatDateTime(task.updatedAt)}</p>

            {role === "STUDENT" ? (
              <form className="stack-sm" onSubmit={(event) => handleSave(event, task.id)}>
                <label className="field">
                  <span>Status</span>
                  <select defaultValue={task.status} name="status">
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>

                <label className="field">
                  <span>Student response</span>
                  <textarea
                    defaultValue={task.studentResponse ?? ""}
                    name="studentResponse"
                    placeholder="Share what was revised or what is still pending..."
                    rows={3}
                  />
                </label>

                <button
                  className="button button-secondary"
                  disabled={busyId === task.id}
                  type="submit"
                >
                  {busyId === task.id ? "Saving..." : "Save Task Update"}
                </button>
              </form>
            ) : task.studentResponse ? (
              <div className="response-note">
                <strong>Student response</strong>
                <p>{task.studentResponse}</p>
              </div>
            ) : (
              <p className="muted-copy">No student response yet.</p>
            )}
          </article>
        ))
      )}
    </div>
  );
}
