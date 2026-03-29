import Link from "next/link";

import { AnalyticsChart } from "@/components/analytics-chart";
import { MetricCard } from "@/components/metric-card";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { getAdminDashboardData, getStudentDashboardData } from "@/lib/server/research-service";
import { requireUser } from "@/lib/server/auth";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    const data = await getAdminDashboardData(user.id);
    const lateStages = data.groups.reduce(
      (total, group) => total + group.lateStages,
      0
    );

    return (
      <div className="stack-xl">
        <section className="hero-banner">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h2>Research progress across all groups</h2>
            <p>
              Review class-wide completion trends, identify delays, and jump into
              management tools whenever a group needs support.
            </p>
          </div>
          <Link className="button button-primary" href="/admin">
            Open Management Workspace
          </Link>
        </section>

        <section className="metrics-grid">
          <MetricCard
            helper="Active student research groups"
            label="Groups"
            value={data.groups.length}
          />
          <MetricCard
            helper="Student accounts currently tracked"
            label="Students"
            value={data.students.length}
          />
          <MetricCard
            helper="Average completion across all workflows"
            label="Completion"
            value={`${data.analytics.completionRate}%`}
          />
          <MetricCard
            helper="Stages currently beyond their due dates"
            label="Late Stages"
            value={lateStages}
          />
        </section>

        <section className="dashboard-grid">
          <AnalyticsChart
            caption="Count of all stages grouped by workflow status."
            data={data.analytics.stageStatusBreakdown}
            title="Stage Overview"
          />
          <AnalyticsChart
            caption="Late stages that need intervention first."
            data={data.analytics.commonDelays}
            title="Common Delays"
          />
          <AnalyticsChart
            caption="Most frequent revision sections from teacher feedback."
            data={data.analytics.revisionIssues}
            title="Revision Hotspots"
          />
          <AnalyticsChart
            caption="Recent activity based on submission timestamps."
            data={data.analytics.submissionFrequency}
            title="Submission Frequency"
          />
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <h3>Group Snapshot</h3>
              <p>Quick overview of progress, pending tasks, and late stages.</p>
            </div>
          </div>

          <div className="stack-lg">
            {data.groups.map((group) => (
              <article className="group-card" key={group.id}>
                <div className="group-card-head">
                  <div>
                    <h4>{group.name}</h4>
                    <p>
                      {group.students.length} student
                      {group.students.length === 1 ? "" : "s"} assigned
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      group.progressPercent === 100
                        ? "APPROVED"
                        : group.pendingTasks > 0
                          ? "REVISED"
                          : "UNDER_REVIEW"
                    }
                  />
                </div>
                <ProgressBar
                  label="Overall research completion"
                  tone="blue"
                  value={group.progressPercent}
                />
                <div className="card-kpis">
                  <span>{group.pendingTasks} pending tasks</span>
                  <span>{group.lateStages} late stages</span>
                  <span>{group.students.map((student) => student.name).join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <h3>Latest Notifications</h3>
              <p>Recent updates coming from submissions, replies, and task changes.</p>
            </div>
          </div>

          <div className="stack-md">
            {data.notifications.length === 0 ? (
              <p className="muted-copy">No notifications yet.</p>
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
      </div>
    );
  }

  const data = await getStudentDashboardData(user.id);
  const group = data.group;

  return (
    <div className="stack-xl">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h2>{group ? `${group.name} research workspace` : "No group assigned yet"}</h2>
          <p>
            Track chapter progress, respond to feedback, complete revision tasks,
            and keep every submission version organized in one place.
          </p>
        </div>
        <Link className="button button-primary" href="/student">
          Open Workspace
        </Link>
      </section>

      <section className="metrics-grid">
        <MetricCard
          helper="Average completion across all research stages"
          label="Progress"
          value={`${group?.progressPercent ?? 0}%`}
        />
        <MetricCard
          helper="Stages waiting for a new draft or revision"
          label="Pending Submissions"
          value={data.pendingSubmissions}
        />
        <MetricCard
          helper="Teacher updates waiting in your inbox"
          label="Feedback Alerts"
          value={data.feedbackCount}
        />
        <MetricCard
          helper="Revision checklist items still open"
          label="Revision Tasks"
          value={data.revisionTasks}
        />
      </section>

      {group ? (
        <>
          <section className="surface-card">
            <div className="section-heading">
              <div>
                <h3>Research Progress</h3>
                <p>Every stage is auto-scored based on its current review status.</p>
              </div>
            </div>

            <ProgressBar
              label="Overall completion"
              tone="green"
              value={group.progressPercent}
            />

            <div className="stage-grid">
              {group.stages.map((stage) => (
                <article className="mini-stage-card" key={stage.id}>
                  <div className="stage-card-top">
                    <strong>{stage.label}</strong>
                    <StatusBadge status={stage.status} />
                  </div>
                  <ProgressBar tone="green" value={stage.progressScore} />
                  <p className="muted-copy">
                    {stage.tasks.filter((task) => task.status === "PENDING").length} open
                    task
                    {stage.tasks.filter((task) => task.status === "PENDING").length === 1
                      ? ""
                      : "s"}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-grid">
            <article className="surface-card">
              <div className="section-heading">
                <div>
                  <h3>Feedback Notifications</h3>
                  <p>Teacher updates for your group workspace.</p>
                </div>
              </div>
              <div className="stack-md">
                {data.notifications.length === 0 ? (
                  <p className="muted-copy">No notifications yet.</p>
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
            </article>

            <article className="surface-card">
              <div className="section-heading">
                <div>
                  <h3>Resource Highlights</h3>
                  <p>Templates, rubrics, papers, and guides from your teacher.</p>
                </div>
              </div>

              <div className="stack-md">
                {data.resources.slice(0, 4).map((resource) => (
                  <article className="resource-row" key={resource.id}>
                    <div>
                      <strong>{resource.title}</strong>
                      <p>{resource.description}</p>
                    </div>
                    <a
                      className="button button-secondary"
                      href={
                        resource.externalUrl || `/api/files/resources/${resource.id}`
                      }
                      rel="noreferrer"
                      target={resource.externalUrl ? "_blank" : undefined}
                    >
                      Open
                    </a>
                  </article>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : (
        <section className="surface-card">
          <p className="muted-copy">
            Your teacher still needs to assign you to a research group before the
            workspace becomes available.
          </p>
        </section>
      )}
    </div>
  );
}
