"use client";

import { useMemo, useState } from "react";

import { MetricCard } from "@/components/metric-card";
import { ProgressBar } from "@/components/progress-bar";
import { ResourceRepository } from "@/components/resource-repository";
import { StageWorkspaceCard } from "@/components/stage-workspace-card";
import { StudentManager } from "@/components/student-manager";
import type { AdminDashboardData } from "@/lib/types";

interface AdminWorkspaceProps {
  data: AdminDashboardData;
}

export function AdminWorkspace({ data }: AdminWorkspaceProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(data.groups[0]?.id ?? "");

  const selectedGroup = useMemo(
    () => data.groups.find((group) => group.id === selectedGroupId) ?? data.groups[0],
    [data.groups, selectedGroupId]
  );

  return (
    <div className="stack-xl">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Management Workspace</p>
          <h2>Teacher tools for calm, clear supervision</h2>
          <p>
            Manage accounts, organize groups, review submissions, leave structured
            feedback, and publish resources in a space that feels simpler for both
            teachers and students.
          </p>
        </div>
      </section>

      <section className="workspace-grid">
        <StudentManager groups={data.groups} students={data.students} />

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <h3>Group Review Workspace</h3>
              <p>Select a group to inspect every stage, version, and feedback thread.</p>
            </div>
          </div>

          <label className="field">
            <span>Choose group</span>
            <select
              onChange={(event) => setSelectedGroupId(event.target.value)}
              value={selectedGroup?.id ?? ""}
            >
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          {selectedGroup ? (
            <div className="stack-lg">
              <div className="metrics-grid">
                <MetricCard
                  helper="Average progress across all research stages"
                  label="Completion"
                  tone="sky"
                  value={`${selectedGroup.progressPercent}%`}
                />
                <MetricCard
                  helper="Open checklist items linked to teacher comments"
                  label="Pending Tasks"
                  tone="sun"
                  value={selectedGroup.pendingTasks}
                />
                <MetricCard
                  helper="Stages already past the due date"
                  label="Late Stages"
                  tone="coral"
                  value={selectedGroup.lateStages}
                />
                <MetricCard
                  helper="Students assigned to this group"
                  label="Members"
                  tone="mint"
                  value={selectedGroup.students.length}
                />
              </div>

              <div className="surface-section">
                <p className="muted-copy">
                  Assigned students:{" "}
                  {selectedGroup.students.map((student) => student.name).join(", ")}
                </p>
                <ProgressBar
                  label="Group completion"
                  tone="blue"
                  value={selectedGroup.progressPercent}
                />
              </div>

              <div className="stack-lg">
                {selectedGroup.stages.map((stage) => (
                  <StageWorkspaceCard
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                    key={stage.id}
                    role="ADMIN"
                    stage={stage}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="muted-copy">Create a student account to start a group workspace.</p>
          )}
        </article>
      </section>

      <ResourceRepository canUpload resources={data.resources} />
    </div>
  );
}
