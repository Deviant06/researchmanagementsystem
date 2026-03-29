"use client";

import { MetricCard } from "@/components/metric-card";
import { ProgressBar } from "@/components/progress-bar";
import { ResourceRepository } from "@/components/resource-repository";
import { StageWorkspaceCard } from "@/components/stage-workspace-card";
import type { StudentDashboardData } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface StudentWorkspaceProps {
  data: StudentDashboardData;
}

export function StudentWorkspace({ data }: StudentWorkspaceProps) {
  if (!data.group) {
    return (
      <section className="surface-card">
        <p className="muted-copy">
          Your account is active, but you do not have a group assignment yet.
          Please ask your teacher to place you in a research group.
        </p>
      </section>
    );
  }

  return (
    <div className="stack-xl">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Student Workspace</p>
          <h2>{data.group.name}</h2>
          <p>
            A clearer space for drafts, revision tasks, and teacher feedback so
            your group always knows the next step.
          </p>
          <div className="hero-chip-list">
            <span className="hero-chip">{data.group.progressPercent}% progress</span>
            <span className="hero-chip">{data.group.students.length} teammates</span>
            <span className="hero-chip">{data.revisionTasks} revision tasks</span>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          helper="Auto-calculated from stage statuses"
          label="Completion"
          tone="mint"
          value={`${data.group.progressPercent}%`}
        />
        <MetricCard
          helper="Stages waiting for new work from your group"
          label="Pending Submissions"
          tone="sun"
          value={data.pendingSubmissions}
        />
        <MetricCard
          helper="Teacher notifications in your workspace"
          label="Feedback Alerts"
          tone="sky"
          value={data.feedbackCount}
        />
        <MetricCard
          helper="Open revision checklist items"
          label="Revision Tasks"
          tone="coral"
          value={data.revisionTasks}
        />
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <h3>Your Team</h3>
            <p>
              Collaborators: {data.group.students.map((student) => student.name).join(", ")}
            </p>
            <p className="muted-copy">
              You can view group members, feedback, and tasks here, while submission history stays limited to your own uploads.
            </p>
          </div>
        </div>
        <ProgressBar
          label="Overall research workflow completion"
          tone="green"
          value={data.group.progressPercent}
        />
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <h3>What’s New</h3>
            <p>Recent updates from your teacher and important group activity.</p>
          </div>
        </div>
        <div className="stack-md">
          {data.notifications.length === 0 ? (
            <p className="muted-copy">No notifications available yet.</p>
          ) : (
            data.notifications.map((notification) => (
              <article className="notification-card" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
                <span>{formatDateTime(notification.createdAt)}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="stack-lg">
        {data.group.stages.map((stage) => (
          <StageWorkspaceCard
            groupId={data.group!.id}
            groupName={data.group!.name}
            key={stage.id}
            role="STUDENT"
            stage={stage}
          />
        ))}
      </div>

      <ResourceRepository canUpload={false} resources={data.resources} />
    </div>
  );
}
