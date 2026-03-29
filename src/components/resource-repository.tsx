"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RESOURCE_CATEGORY_LABELS } from "@/lib/constants";
import { requestJson } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";
import type { ResourceRecord } from "@/lib/types";

interface ResourceRepositoryProps {
  canUpload: boolean;
  resources: ResourceRecord[];
}

export function ResourceRepository({
  canUpload,
  resources
}: ResourceRepositoryProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      await requestJson("/api/resources", {
        method: "POST",
        body: new FormData(event.currentTarget)
      });

      setFeedback("Resource uploaded successfully.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg">
      <article className="surface-card">
        <div className="section-heading">
          <div>
            <h3>Resource Repository</h3>
            <p>Templates, rubrics, sample papers, and video guides for every group.</p>
          </div>
        </div>

        {canUpload ? (
          <form className="stack-sm" onSubmit={handleUpload}>
            {feedback ? <p className="form-success">{feedback}</p> : null}

            <div className="card-form-grid">
              <label className="field">
                <span>Title</span>
                <input name="title" required type="text" />
              </label>

              <label className="field">
                <span>Category</span>
                <select defaultValue="TEMPLATE" name="category">
                  {Object.entries(RESOURCE_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="Explain how students should use this resource..."
                required
                rows={3}
              />
            </label>

            <div className="card-form-grid">
              <label className="field">
                <span>Upload file</span>
                <input name="file" type="file" />
              </label>

              <label className="field">
                <span>External link (optional)</span>
                <input
                  name="externalUrl"
                  placeholder="https://..."
                  type="url"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" disabled={busy} type="submit">
                {busy ? "Uploading..." : "Upload Resource"}
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <article className="surface-card">
        <div className="resource-list">
          {resources.length === 0 ? (
            <p className="muted-copy">No resources uploaded yet.</p>
          ) : (
            resources.map((resource) => (
              <article className="resource-row" key={resource.id}>
                <div className="stack-xs">
                  <div className="inline-cluster">
                    <strong>{resource.title}</strong>
                    <span className="badge badge-blue">
                      {RESOURCE_CATEGORY_LABELS[resource.category]}
                    </span>
                  </div>
                  <p>{resource.description}</p>
                  <span className="muted-copy">
                    Uploaded {formatDateTime(resource.createdAt)}
                  </span>
                </div>

                <a
                  className="button button-secondary"
                  href={resource.externalUrl || `/api/files/resources/${resource.id}`}
                  rel="noreferrer"
                  target={resource.externalUrl ? "_blank" : undefined}
                >
                  {resource.externalUrl ? "Open Link" : "Download"}
                </a>
              </article>
            ))
          )}
        </div>
      </article>
    </div>
  );
}
