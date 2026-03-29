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
            <h2>Class research progress at a glance</h2>
            <p>
              Spot bottlenecks quickly, check which groups need support, and move
              from analytics to action without digging through clutter.
            </p>
            <div className="hero-chip-list">
              <span className="hero-chip">{data.groups.length} active groups</span>
              <span className="hero-chip">{lateStages} late stages</span>
              <span className="hero-chip">{data.analytics.completionRate}% average completion</span>
            </div>
          </div>
          <Link className="button button-primary" href="/admin">
            Open Management Workspace
          </Link>
        </section>

        <section className="metrics-grid">
          <MetricCard
            helper="Active student research groups"
            label="Groups"
            tone="sky"
            value={data.groups.length}
          />
          <MetricCard
            helper="Student accounts currently tracked"
            label="Students"
            tone="mint"
            value={data.students.length}
          />
          <MetricCard
            helper="Average completion across all workflows"
            label="Completion"
            tone="violet"
            value={`${data.analytics.completionRate}%`}
          />
          <MetricCard
            helper="Stages currently beyond their due dates"
            label="Late Stages"
            tone="coral"
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
          <h2>{group ? `${group.name} research journey` : "No group assigned yet"}</h2>
          <p>
            See what needs attention today, track your group’s progress, and stay
            confident about what to submit next.
          </p>
          {group ? (
            <div className="hero-chip-list">
              <span className="hero-chip">{group.progressPercent}% complete</span>
              <span className="hero-chip">{data.revisionTasks} open revision tasks</span>
              <span className="hero-chip">{group.students.length} group members</span>
            </div>
          ) : null}
        </div>
        <Link className="button button-primary" href="/student">
          Go to My Workspace
        </Link>
      </section>

      <section className="metrics-grid">
        <MetricCard
          helper="Your group’s overall chapter progress"
          label="Overall Progress"
          tone="mint"
          value={`${group?.progressPercent ?? 0}%`}
        />
        <MetricCard
          helper="Stages that still need a new draft from your team"
          label="What to Submit"
          tone="sun"
          value={data.pendingSubmissions}
        />
        <MetricCard
          helper="Teacher feedback waiting for your attention"
          label="Teacher Notes"
          tone="sky"
          value={data.feedbackCount}
        />
        <MetricCard
          helper="Checklist items your group still needs to finish"
          label="Open Revisions"
          tone="coral"
          value={data.revisionTasks}
        />
      </section>

      {group ? (
        <>
          <section className="surface-card">
            <div className="section-heading">
              <div>
                <h3>Where Your Group Stands</h3>
                <p>Each stage updates automatically so you always know what is done and what needs revision.</p>
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
                  <h3>Teacher Updates</h3>
                  <p>Friendly reminders, review notes, and revision updates for your team.</p>
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
                  <h3>Helpful Resources</h3>
                  <p>Templates, rubrics, sample papers, and quick guides you can use right away.</p>
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
