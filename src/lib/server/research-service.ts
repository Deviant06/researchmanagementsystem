import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ADMIN_TEMP_PASSWORD,
  COMMENT_CATEGORY_LABELS,
  RESEARCH_STAGES,
  STATUS_PROGRESS
} from "@/lib/constants";
import { toSafeUser } from "@/lib/server/auth";
import { createNotification } from "@/lib/server/notification-center";
import type { Database } from "@/lib/server/supabase-types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedDocument, sanitizeFileName, titleCase } from "@/lib/utils";
import type {
  AdminAnalytics,
  AdminDashboardData,
  CommentCategory,
  CommentRecord,
  EnrichedComment,
  EnrichedStage,
  GroupRecord,
  GroupWorkspace,
  NotificationRecord,
  ResourceCategory,
  ResourceRecord,
  SafeUser,
  StageKey,
  StageRecord,
  StageStatus,
  StudentDashboardData,
  SubmissionRecord,
  TaskRecord,
  UserRecord
} from "@/lib/types";

const SUBMISSION_BUCKET = "submission-files";
const RESOURCE_BUCKET = "resource-files";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
type StageRow = Database["public"]["Tables"]["stages"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentReplyRow = Database["public"]["Tables"]["comment_replies"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface Dataset {
  users: UserRecord[];
  groups: GroupRecord[];
  stages: StageRecord[];
  submissions: SubmissionRecord[];
  comments: CommentRecord[];
  tasks: TaskRecord[];
  resources: ResourceRecord[];
}

function nowIso() {
  return new Date().toISOString();
}

function stageLabel(stageKey: StageKey) {
  return (
    RESEARCH_STAGES.find((stage) => stage.key === stageKey)?.label ?? stageKey
  );
}

function ensureAdmin(user: SafeUser) {
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }
}

function ensureGroupAccess(user: SafeUser, groupId: string) {
  if (user.role === "ADMIN") {
    return;
  }

  if (user.groupId !== groupId) {
    throw new Error("You can only access your own group workspace.");
  }
}

function mapUser(profile: ProfileRow): UserRecord {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    groupId: profile.group_id,
    emailAlertsEnabled: profile.email_alerts,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    lastLoginAt: profile.last_login_at
  };
}

function mapGroup(group: GroupRow, studentIds: string[]): GroupRecord {
  return {
    id: group.id,
    name: group.name,
    studentIds,
    createdAt: group.created_at,
    updatedAt: group.updated_at
  };
}

function mapStage(stage: StageRow): StageRecord {
  return {
    id: stage.id,
    groupId: stage.group_id,
    stageKey: stage.stage_key,
    status: stage.status,
    dueDate: stage.due_date,
    updatedAt: stage.updated_at,
    lastSubmissionAt: stage.last_submission_at,
    lastReviewedAt: stage.last_reviewed_at
  };
}

function mapSubmission(submission: SubmissionRow): SubmissionRecord {
  return {
    id: submission.id,
    groupId: submission.group_id,
    stageKey: submission.stage_key,
    version: submission.version,
    submissionType: submission.submission_type,
    fileName: submission.file_name,
    filePath: submission.file_path,
    content: submission.content,
    uploadedByUserId: submission.uploaded_by_user_id,
    createdAt: submission.created_at
  };
}

function mapTask(task: TaskRow): TaskRecord {
  return {
    id: task.id,
    groupId: task.group_id,
    stageKey: task.stage_key,
    commentId: task.comment_id,
    description: task.description,
    status: task.status,
    studentResponse: task.student_response,
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
}

function mapResource(resource: ResourceRow): ResourceRecord {
  return {
    id: resource.id,
    category: resource.category,
    title: resource.title,
    description: resource.description,
    fileName: resource.file_name,
    filePath: resource.file_path,
    externalUrl: resource.external_url,
    uploadedByUserId: resource.uploaded_by_user_id,
    createdAt: resource.created_at
  };
}

function mapNotification(
  notification: NotificationRow,
  targetUserIds: string[]
): NotificationRecord {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    targetUserIds,
    groupId: notification.group_id,
    stageKey: notification.stage_key,
    createdAt: notification.created_at
  };
}

async function assertQuery<T>(
  label: string,
  promise: any
): Promise<T> {
  const result = await promise;

  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data as T;
}

function createDefaultStages(groupId: string, baseDate = new Date()) {
  return RESEARCH_STAGES.map<Database["public"]["Tables"]["stages"]["Insert"]>(
    (stage) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + stage.dueOffsetDays);

      return {
        group_id: groupId,
        stage_key: stage.key,
        status: "NOT_STARTED",
        due_date: dueDate.toISOString(),
        updated_at: baseDate.toISOString(),
        last_submission_at: null,
        last_reviewed_at: null
      };
    }
  );
}

async function getProfileById(admin: SupabaseClient<Database>, userId: string) {
  return assertQuery<ProfileRow>(
    "Unable to load user profile",
    admin.from("profiles").select("*").eq("id", userId).single()
  );
}

async function getGroupById(admin: SupabaseClient<Database>, groupId: string) {
  return assertQuery<GroupRow>(
    "Unable to load group",
    admin.from("groups").select("*").eq("id", groupId).single()
  );
}

async function getStageByGroupAndKey(
  admin: SupabaseClient<Database>,
  groupId: string,
  stageKey: StageKey
) {
  return assertQuery<StageRow>(
    "Unable to load stage",
    admin
      .from("stages")
      .select("*")
      .eq("group_id", groupId)
      .eq("stage_key", stageKey)
      .single()
  );
}

async function getGroupMemberIds(
  admin: SupabaseClient<Database>,
  groupId: string
) {
  const profiles = await assertQuery<Array<Pick<ProfileRow, "id">>>(
    "Unable to load group members",
    admin.from("profiles").select("id").eq("group_id", groupId)
  );

  return (profiles ?? []).map((profile) => profile.id);
}

async function getAdminUserIds(admin: SupabaseClient<Database>) {
  const profiles = await assertQuery<Array<Pick<ProfileRow, "id">>>(
    "Unable to load admin accounts",
    admin.from("profiles").select("id").eq("role", "ADMIN")
  );

  return (profiles ?? []).map((profile) => profile.id);
}

async function findOrCreateGroup(
  admin: SupabaseClient<Database>,
  groupName: string
) {
  const normalized = titleCase(groupName.trim());
  const existing = await assertQuery<GroupRow | null>(
    "Unable to load group",
    admin.from("groups").select("*").eq("name", normalized).maybeSingle()
  );

  if (existing) {
    return existing;
  }

  const created = await assertQuery<GroupRow>(
    "Unable to create group",
    admin.from("groups").insert({ name: normalized }).select("*").single()
  );

  await assertQuery<null>(
    "Unable to create group stages",
    admin.from("stages").insert(createDefaultStages(created.id, new Date()))
  );

  return created;
}

async function loadDataset(groupIds?: string[]): Promise<Dataset> {
  const admin = createSupabaseAdminClient();
  const [profiles, groups] = await Promise.all([
    assertQuery<ProfileRow[]>(
      "Unable to load users",
      admin.from("profiles").select("*")
    ),
    groupIds && groupIds.length > 0
      ? assertQuery<GroupRow[]>(
          "Unable to load groups",
          admin.from("groups").select("*").in("id", groupIds)
        )
      : assertQuery<GroupRow[]>(
          "Unable to load groups",
          admin.from("groups").select("*")
        )
  ]);

  const resolvedGroupIds = (groups ?? []).map((group) => group.id);

  const [stages, submissions, comments, tasks, resources] = await Promise.all([
    resolvedGroupIds.length > 0
      ? assertQuery<StageRow[]>(
          "Unable to load stages",
          admin.from("stages").select("*").in("group_id", resolvedGroupIds)
        )
      : Promise.resolve([] as StageRow[]),
    resolvedGroupIds.length > 0
      ? assertQuery<SubmissionRow[]>(
          "Unable to load submissions",
          admin.from("submissions").select("*").in("group_id", resolvedGroupIds)
        )
      : Promise.resolve([] as SubmissionRow[]),
    resolvedGroupIds.length > 0
      ? assertQuery<CommentRow[]>(
          "Unable to load comments",
          admin.from("comments").select("*").in("group_id", resolvedGroupIds)
        )
      : Promise.resolve([] as CommentRow[]),
    resolvedGroupIds.length > 0
      ? assertQuery<TaskRow[]>(
          "Unable to load tasks",
          admin.from("tasks").select("*").in("group_id", resolvedGroupIds)
        )
      : Promise.resolve([] as TaskRow[]),
    assertQuery<ResourceRow[]>(
      "Unable to load resources",
      admin.from("resources").select("*").order("created_at", { ascending: false })
    )
  ]);

  const commentIds = (comments ?? []).map((comment) => comment.id);
  const replies =
    commentIds.length > 0
      ? await assertQuery<CommentReplyRow[]>(
          "Unable to load comment replies",
          admin.from("comment_replies").select("*").in("comment_id", commentIds)
        )
      : [];

  const users = (profiles ?? []).map(mapUser);
  const studentIdsByGroup = new Map<string, string[]>();

  users
    .filter((user) => user.role === "STUDENT" && user.groupId)
    .forEach((user) => {
      const current = studentIdsByGroup.get(user.groupId!) ?? [];
      current.push(user.id);
      studentIdsByGroup.set(user.groupId!, current);
    });

  const mappedTasks = (tasks ?? []).map(mapTask);
  const taskByCommentId = new Map<string, string>();
  mappedTasks.forEach((task) => {
    taskByCommentId.set(task.commentId, task.id);
  });

  const repliesByCommentId = new Map<string, CommentReplyRow[]>();
  (replies ?? []).forEach((reply) => {
    const current = repliesByCommentId.get(reply.comment_id) ?? [];
    current.push(reply);
    repliesByCommentId.set(reply.comment_id, current);
  });

  return {
    users,
    groups: (groups ?? []).map((group) =>
      mapGroup(group, studentIdsByGroup.get(group.id) ?? [])
    ),
    stages: (stages ?? []).map(mapStage),
    submissions: (submissions ?? []).map(mapSubmission),
    comments: (comments ?? []).map((comment) => ({
      id: comment.id,
      groupId: comment.group_id,
      stageKey: comment.stage_key,
      section: comment.section,
      category: comment.category,
      text: comment.text,
      createdByUserId: comment.created_by_user_id,
      createdAt: comment.created_at,
      addressedAt: comment.addressed_at,
      addressedByUserId: comment.addressed_by_user_id,
      replies: (repliesByCommentId.get(comment.id) ?? []).map((reply) => ({
        id: reply.id,
        userId: reply.user_id,
        text: reply.text,
        createdAt: reply.created_at
      })),
      taskId: taskByCommentId.get(comment.id) ?? null
    })),
    tasks: mappedTasks,
    resources: (resources ?? []).map(mapResource)
  };
}

function getUserById(dataset: Dataset, userId: string) {
  return dataset.users.find((user) => user.id === userId);
}

function getStageRecord(
  dataset: Dataset,
  groupId: string,
  stageKey: StageKey
) {
  return dataset.stages.find(
    (stage) => stage.groupId === groupId && stage.stageKey === stageKey
  );
}

function enrichComments(dataset: Dataset, comments: CommentRecord[]) {
  return comments
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map<EnrichedComment>((comment) => ({
      ...comment,
      createdByName:
        getUserById(dataset, comment.createdByUserId)?.name ?? "Former user",
      replies: comment.replies.map((reply) => ({
        ...reply,
        userName: getUserById(dataset, reply.userId)?.name ?? "Former user"
      }))
    }));
}

function buildWorkspace(dataset: Dataset, groupId: string): GroupWorkspace {
  const group = dataset.groups.find((entry) => entry.id === groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  const students = group.studentIds
    .map((studentId) => dataset.users.find((user) => user.id === studentId))
    .filter(Boolean)
    .map((user) => user!);

  const stages = RESEARCH_STAGES.map<EnrichedStage>((stageDefinition) => {
    const stage = getStageRecord(dataset, groupId, stageDefinition.key);

    if (!stage) {
      throw new Error(`Stage ${stageDefinition.label} is missing for ${group.name}.`);
    }

    const submissions = dataset.submissions
      .filter(
        (submission) =>
          submission.groupId === groupId &&
          submission.stageKey === stageDefinition.key
      )
      .sort((left, right) => right.version - left.version)
      .map((submission) => ({
        ...submission,
        uploaderName:
          getUserById(dataset, submission.uploadedByUserId)?.name ?? "Former user"
      }));

    const comments = enrichComments(
      dataset,
      dataset.comments.filter(
        (comment) =>
          comment.groupId === groupId && comment.stageKey === stageDefinition.key
      )
    );

    const tasks = dataset.tasks
      .filter((task) => task.groupId === groupId && task.stageKey === stageDefinition.key)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((task) => ({
        ...task,
        comment: comments.find((comment) => comment.id === task.commentId)
      }));

    const isLate =
      new Date(stage.dueDate).getTime() < Date.now() && stage.status !== "APPROVED";

    return {
      ...stage,
      label: stageDefinition.label,
      submissions,
      comments,
      tasks,
      progressScore: STATUS_PROGRESS[stage.status],
      isLate
    };
  });

  const progressPercent = Math.round(
    stages.reduce((total, stage) => total + stage.progressScore, 0) / stages.length
  );

  return {
    ...group,
    students,
    stages,
    progressPercent,
    pendingTasks: stages.reduce(
      (total, stage) =>
        total + stage.tasks.filter((task) => task.status === "PENDING").length,
      0
    ),
    lateStages: stages.filter((stage) => stage.isLate).length
  };
}

function buildSubmissionFrequency(dataset: Dataset) {
  const map = new Map<string, number>();

  dataset.submissions.forEach((submission) => {
    const label = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric"
    }).format(new Date(submission.createdAt));
    map.set(label, (map.get(label) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value, color: "#2563eb" }))
    .slice(-7);
}

function buildAdminAnalytics(dataset: Dataset, groups: GroupWorkspace[]): AdminAnalytics {
  const allStages = groups.flatMap((group) => group.stages);
  const completionRate = groups.length
    ? Math.round(
        groups.reduce((total, group) => total + group.progressPercent, 0) /
          groups.length
      )
    : 0;

  const statusCounts = new Map<StageStatus, number>([
    ["NOT_STARTED", 0],
    ["SUBMITTED", 0],
    ["UNDER_REVIEW", 0],
    ["REVISED", 0],
    ["APPROVED", 0]
  ]);

  allStages.forEach((stage) => {
    statusCounts.set(stage.status, (statusCounts.get(stage.status) ?? 0) + 1);
  });

  const delayCounts = new Map<string, number>();
  allStages
    .filter((stage) => stage.isLate)
    .forEach((stage) => {
      delayCounts.set(stage.label, (delayCounts.get(stage.label) ?? 0) + 1);
    });

  const revisionIssues = new Map<string, number>();
  dataset.comments.forEach((comment) => {
    revisionIssues.set(
      comment.section,
      (revisionIssues.get(comment.section) ?? 0) + 1
    );
  });

  return {
    completionRate,
    stageStatusBreakdown: [
      {
        label: "Not Started",
        value: statusCounts.get("NOT_STARTED") ?? 0,
        color: "#64748b"
      },
      {
        label: "Submitted",
        value: statusCounts.get("SUBMITTED") ?? 0,
        color: "#dc2626"
      },
      {
        label: "Under Review",
        value: statusCounts.get("UNDER_REVIEW") ?? 0,
        color: "#2563eb"
      },
      {
        label: "Revision Needed",
        value: statusCounts.get("REVISED") ?? 0,
        color: "#d97706"
      },
      {
        label: "Approved",
        value: statusCounts.get("APPROVED") ?? 0,
        color: "#16a34a"
      }
    ],
    commonDelays: Array.from(delayCounts.entries())
      .map(([label, value]) => ({ label, value, color: "#ea580c" }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    revisionIssues: Array.from(revisionIssues.entries())
      .map(([label, value]) => ({ label, value, color: "#9333ea" }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    submissionFrequency: buildSubmissionFrequency(dataset)
  };
}

async function loadNotificationsForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const recipients = await assertQuery<
    Array<Pick<Database["public"]["Tables"]["notification_recipients"]["Row"], "notification_id" | "created_at">>
  >(
    "Unable to load notification recipients",
    admin
      .from("notification_recipients")
      .select("notification_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
  );

  if (!recipients || recipients.length === 0) {
    return [] as NotificationRecord[];
  }

  const notificationIds = recipients.map((recipient) => recipient.notification_id);
  const notifications = await assertQuery<NotificationRow[]>(
    "Unable to load notifications",
    admin.from("notifications").select("*").in("id", notificationIds)
  );

  const order = new Map<string, number>();
  notificationIds.forEach((id, index) => order.set(id, index));

  return (notifications ?? [])
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
    .map((notification) => mapNotification(notification, [userId]));
}

async function uploadToStorage(
  admin: SupabaseClient<Database>,
  bucket: string,
  storagePath: string,
  file: File
) {
  const { error } = await admin.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false
    });

  if (error) {
    throw new Error(`Unable to upload file: ${error.message}`);
  }
}

async function createSignedUrl(
  admin: SupabaseClient<Database>,
  bucket: string,
  storagePath: string
) {
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Unable to create download link: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}

export async function getAdminDashboardData(
  userId: string
): Promise<AdminDashboardData> {
  const admin = createSupabaseAdminClient();
  const currentUser = await getProfileById(admin, userId);

  if (!currentUser) {
    throw new Error("User not found.");
  }

  const dataset = await loadDataset();
  const groups = dataset.groups.map((group) => buildWorkspace(dataset, group.id));

  return {
    currentUser: toSafeUser(currentUser),
    students: dataset.users
      .filter((user) => user.role === "STUDENT")
      .map((user) => user),
    groups,
    resources: dataset.resources
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    notifications: await loadNotificationsForUser(userId),
    analytics: buildAdminAnalytics(dataset, groups)
  };
}

export async function getStudentDashboardData(
  userId: string
): Promise<StudentDashboardData> {
  const admin = createSupabaseAdminClient();
  const currentUser = await getProfileById(admin, userId);

  if (!currentUser) {
    throw new Error("User not found.");
  }

  const dataset = currentUser.group_id
    ? await loadDataset([currentUser.group_id])
    : {
        users: [mapUser(currentUser)],
        groups: [],
        stages: [],
        submissions: [],
        comments: [],
        tasks: [],
        resources: (
          await assertQuery<ResourceRow[]>(
            "Unable to load resources",
            admin.from("resources").select("*").order("created_at", { ascending: false })
          )
        ).map(mapResource)
      };
  const group = currentUser.group_id
    ? buildWorkspace(dataset, currentUser.group_id)
    : null;
  const notifications = await loadNotificationsForUser(userId);

  return {
    currentUser: toSafeUser(currentUser),
    group,
    resources: dataset.resources
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    notifications,
    pendingSubmissions: group
      ? group.stages.filter(
          (stage) => stage.status === "NOT_STARTED" || stage.status === "REVISED"
        ).length
      : 0,
    feedbackCount: notifications.filter((note) => note.type === "FEEDBACK").length,
    revisionTasks: group?.pendingTasks ?? 0
  };
}

export async function createStudentAccount(
  actor: SafeUser,
  input: {
    name: string;
    email: string;
    groupName: string;
  }
) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const group = await findOrCreateGroup(admin, input.groupName);
  const name = titleCase(input.name);
  const email = input.email.toLowerCase();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: ADMIN_TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: name
    },
    app_metadata: {
      role: "STUDENT"
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create student account.");
  }

  await assertQuery<null>(
    "Unable to save student profile",
    admin.from("profiles").upsert({
      id: data.user.id,
      role: "STUDENT",
      name,
      email,
      group_id: group.id,
      email_alerts: true
    })
  );

  return {
    temporaryPassword: ADMIN_TEMP_PASSWORD
  };
}

export async function updateStudentAccount(
  actor: SafeUser,
  studentId: string,
  input: {
    name: string;
    email: string;
    groupName: string;
  }
) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const group = await findOrCreateGroup(admin, input.groupName);
  const name = titleCase(input.name);
  const email = input.email.toLowerCase();
  const { error } = await admin.auth.admin.updateUserById(studentId, {
    email,
    user_metadata: {
      full_name: name
    },
    app_metadata: {
      role: "STUDENT"
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  await assertQuery<null>(
    "Unable to update student profile",
    admin
      .from("profiles")
      .update({
        name,
        email,
        group_id: group.id
      })
      .eq("id", studentId)
  );
}

export async function deleteStudentAccount(actor: SafeUser, studentId: string) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(studentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetStudentPassword(actor: SafeUser, studentId: string) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(studentId, {
    password: ADMIN_TEMP_PASSWORD
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    temporaryPassword: ADMIN_TEMP_PASSWORD
  };
}

export async function updateStageDetails(
  actor: SafeUser,
  groupId: string,
  stageKey: StageKey,
  input: {
    status?: StageStatus;
    dueDate?: string;
  }
) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const group = await getGroupById(admin, groupId);
  const stage = await getStageByGroupAndKey(admin, groupId, stageKey);

  if (!stage) {
    throw new Error("Stage not found.");
  }

  const nextStatus = input.status ?? stage.status;
  await assertQuery<null>(
    "Unable to update stage",
    admin
      .from("stages")
      .update({
        status: nextStatus,
        due_date: input.dueDate ?? stage.due_date,
        updated_at: nowIso()
      })
      .eq("id", stage.id)
  );

  if (input.status && input.status !== stage.status) {
    await createNotification(admin, {
      type: "STATUS",
      title: `${stageLabel(stageKey)} status updated`,
      message: `${group!.name} is now marked as ${input.status.replaceAll("_", " ").toLowerCase()}.`,
      targetUserIds: await getGroupMemberIds(admin, groupId),
      groupId,
      stageKey
    });
  }
}

export async function createSubmission(
  actor: SafeUser,
  groupId: string,
  stageKey: StageKey,
  input: {
    content: string;
    file?: File | null;
  }
) {
  ensureGroupAccess(actor, groupId);

  const admin = createSupabaseAdminClient();
  const group = await getGroupById(admin, groupId);
  const stage = await getStageByGroupAndKey(admin, groupId, stageKey);
  const trimmedContent = input.content.trim();
  const file = input.file ?? null;

  if (!stage || !group) {
    throw new Error("Stage not found.");
  }

  if (!trimmedContent && !file) {
    throw new Error("Please add submission text or upload a file.");
  }

  if (file && !isAllowedDocument(file.name)) {
    throw new Error("Only PDF and DOCX files are allowed for submissions.");
  }

  const latestSubmission = await assertQuery<
    Pick<SubmissionRow, "version"> | null
  >(
    "Unable to determine submission version",
    admin
      .from("submissions")
      .select("version")
      .eq("group_id", groupId)
      .eq("stage_key", stageKey)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  const version = (latestSubmission?.version ?? 0) + 1;
  let fileName: string | null = null;
  let filePath: string | null = null;

  if (file) {
    const storagePath = `${groupId}/${stageKey}/v${version}-${sanitizeFileName(
      file.name
    )}`;
    await uploadToStorage(admin, SUBMISSION_BUCKET, storagePath, file);
    fileName = file.name;
    filePath = storagePath;
  }

  const timestamp = nowIso();
  await assertQuery<null>(
    "Unable to save submission",
    admin.from("submissions").insert({
      group_id: groupId,
      stage_key: stageKey,
      version,
      submission_type: file ? "FILE" : "TEXT",
      file_name: fileName,
      file_path: filePath,
      content: trimmedContent || null,
      uploaded_by_user_id: actor.id,
      created_at: timestamp
    })
  );

  await assertQuery<null>(
    "Unable to update stage after submission",
    admin
      .from("stages")
      .update({
        status: "SUBMITTED",
        updated_at: timestamp,
        last_submission_at: timestamp
      })
      .eq("id", stage.id)
  );

  await createNotification(admin, {
    type: "SUBMISSION",
    title: `${group.name} submitted ${stageLabel(stageKey)}`,
    message: `${actor.name} uploaded version ${version} for teacher review.`,
    targetUserIds: await getAdminUserIds(admin),
    groupId,
    stageKey
  });
}

export async function createComment(
  actor: SafeUser,
  groupId: string,
  stageKey: StageKey,
  input: {
    section: string;
    category: CommentCategory;
    text: string;
  }
) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();
  const group = await getGroupById(admin, groupId);
  const stage = await getStageByGroupAndKey(admin, groupId, stageKey);

  if (!group || !stage) {
    throw new Error("Stage not found.");
  }

  const timestamp = nowIso();
  const comment = await assertQuery<CommentRow>(
    "Unable to save comment",
    admin
      .from("comments")
      .insert({
        group_id: groupId,
        stage_key: stageKey,
        section: titleCase(input.section),
        category: input.category,
        text: input.text.trim(),
        created_by_user_id: actor.id,
        created_at: timestamp,
        addressed_at: input.category === "APPROVED" ? timestamp : null,
        addressed_by_user_id: input.category === "APPROVED" ? actor.id : null
      })
      .select("*")
      .single()
  );

  await assertQuery<null>(
    "Unable to create revision task",
    admin.from("tasks").insert({
      group_id: groupId,
      stage_key: stageKey,
      comment_id: comment.id,
      description: `${titleCase(input.section)}: ${input.text.trim()}`,
      status: input.category === "APPROVED" ? "COMPLETED" : "PENDING",
      student_response:
        input.category === "APPROVED" ? "Marked approved by the teacher." : null,
      created_at: timestamp,
      updated_at: timestamp
    })
  );

  await assertQuery<null>(
    "Unable to update stage after feedback",
    admin
      .from("stages")
      .update({
        status: input.category === "APPROVED" ? "APPROVED" : "REVISED",
        updated_at: timestamp,
        last_reviewed_at: timestamp
      })
      .eq("id", stage.id)
  );

  await createNotification(admin, {
    type: input.category === "APPROVED" ? "STATUS" : "FEEDBACK",
    title: `${stageLabel(stageKey)} ${COMMENT_CATEGORY_LABELS[input.category]}`,
    message: `${titleCase(input.section)} now has teacher feedback for ${group.name}.`,
    targetUserIds: await getGroupMemberIds(admin, groupId),
    groupId,
    stageKey
  });
}

export async function replyToComment(
  actor: SafeUser,
  commentId: string,
  text: string
) {
  const admin = createSupabaseAdminClient();
  const comment = await assertQuery<CommentRow>(
    "Unable to load comment",
    admin.from("comments").select("*").eq("id", commentId).single()
  );

  if (!comment) {
    throw new Error("Comment not found.");
  }

  ensureGroupAccess(actor, comment.group_id);

  await assertQuery<null>(
    "Unable to save reply",
    admin.from("comment_replies").insert({
      comment_id: comment.id,
      user_id: actor.id,
      text: text.trim(),
      created_at: nowIso()
    })
  );

  const targetUserIds =
    actor.role === "ADMIN"
      ? await getGroupMemberIds(admin, comment.group_id)
      : await getAdminUserIds(admin);
  const group = await getGroupById(admin, comment.group_id);

  await createNotification(admin, {
    type: "FEEDBACK",
    title: actor.role === "ADMIN" ? "Teacher replied to a thread" : "Student replied",
    message:
      actor.role === "ADMIN"
        ? `${actor.name} replied in ${stageLabel(comment.stage_key)}.`
        : `${actor.name} replied to a feedback thread in ${group?.name ?? "the group workspace"}.`,
    targetUserIds,
    groupId: comment.group_id,
    stageKey: comment.stage_key
  });
}

export async function addressComment(actor: SafeUser, commentId: string) {
  const admin = createSupabaseAdminClient();
  const comment = await assertQuery<CommentRow>(
    "Unable to load comment",
    admin.from("comments").select("*").eq("id", commentId).single()
  );

  if (!comment) {
    throw new Error("Comment not found.");
  }

  ensureGroupAccess(actor, comment.group_id);

  await assertQuery<null>(
    "Unable to mark comment as addressed",
    admin
      .from("comments")
      .update({
        addressed_at: nowIso(),
        addressed_by_user_id: actor.id
      })
      .eq("id", commentId)
  );

  await createNotification(admin, {
    type: "REVISION_TASK",
    title: "Comment marked as addressed",
    message: `${actor.name} marked ${comment.section} as addressed.`,
    targetUserIds: await getAdminUserIds(admin),
    groupId: comment.group_id,
    stageKey: comment.stage_key
  });
}

export async function updateTask(
  actor: SafeUser,
  taskId: string,
  input: {
    status?: "PENDING" | "COMPLETED";
    studentResponse?: string;
  }
) {
  const admin = createSupabaseAdminClient();
  const task = await assertQuery<TaskRow>(
    "Unable to load task",
    admin.from("tasks").select("*").eq("id", taskId).single()
  );

  if (!task) {
    throw new Error("Task not found.");
  }

  ensureGroupAccess(actor, task.group_id);

  const updatedAt = nowIso();
  await assertQuery<null>(
    "Unable to update task",
    admin
      .from("tasks")
      .update({
        status: input.status ?? task.status,
        student_response:
          typeof input.studentResponse === "string"
            ? input.studentResponse.trim() || null
            : task.student_response,
        updated_at: updatedAt
      })
      .eq("id", taskId)
  );

  if (input.status === "COMPLETED") {
    await assertQuery<null>(
      "Unable to update linked comment",
      admin
        .from("comments")
        .update({
          addressed_at: updatedAt,
          addressed_by_user_id: actor.id
        })
        .eq("id", task.comment_id)
        .is("addressed_at", null)
    );
  }

  await createNotification(admin, {
    type: "REVISION_TASK",
    title: "Revision task updated",
    message: `${actor.name} updated a task in ${stageLabel(task.stage_key)}.`,
    targetUserIds: await getAdminUserIds(admin),
    groupId: task.group_id,
    stageKey: task.stage_key
  });
}

export async function uploadResource(
  actor: SafeUser,
  input: {
    title: string;
    description: string;
    category: ResourceCategory;
    externalUrl?: string;
    file?: File | null;
  }
) {
  ensureAdmin(actor);

  const admin = createSupabaseAdminClient();

  if (!input.externalUrl && !input.file) {
    throw new Error("Please upload a file or provide a video/resource link.");
  }

  let fileName: string | null = null;
  let filePath: string | null = null;

  if (input.file) {
    const storagePath = `resources/${Date.now()}-${sanitizeFileName(input.file.name)}`;
    await uploadToStorage(admin, RESOURCE_BUCKET, storagePath, input.file);
    fileName = input.file.name;
    filePath = storagePath;
  }

  await assertQuery<null>(
    "Unable to save resource",
    admin.from("resources").insert({
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      file_name: fileName,
      file_path: filePath,
      external_url: input.externalUrl?.trim() || null,
      uploaded_by_user_id: actor.id,
      created_at: nowIso()
    })
  );

  const students = await assertQuery<Array<Pick<ProfileRow, "id">>>(
    "Unable to load student accounts",
    admin.from("profiles").select("id").eq("role", "STUDENT")
  );

  await createNotification(admin, {
    type: "RESOURCE",
    title: "New resource available",
    message: `${input.title.trim()} was added to the repository.`,
    targetUserIds: (students ?? []).map((student) => student.id),
    groupId: null,
    stageKey: null
  });
}

export async function getSubmissionDownload(
  actor: SafeUser,
  submissionId: string
) {
  const admin = createSupabaseAdminClient();
  const submission = await assertQuery<SubmissionRow>(
    "Unable to load submission",
    admin.from("submissions").select("*").eq("id", submissionId).single()
  );

  if (!submission) {
    throw new Error("Submission not found.");
  }

  ensureGroupAccess(actor, submission.group_id);

  if (!submission.file_path) {
    throw new Error("This submission does not have an uploaded file.");
  }

  return {
    fileName: submission.file_name,
    signedUrl: await createSignedUrl(admin, SUBMISSION_BUCKET, submission.file_path)
  };
}

export async function getResourceDownload(actor: SafeUser, resourceId: string) {
  const admin = createSupabaseAdminClient();
  const resource = await assertQuery<ResourceRow>(
    "Unable to load resource",
    admin.from("resources").select("*").eq("id", resourceId).single()
  );

  if (!resource) {
    throw new Error("Resource not found.");
  }

  if (!resource.file_path) {
    throw new Error("This resource is stored as a link.");
  }

  if (actor.role !== "ADMIN" && actor.role !== "STUDENT") {
    throw new Error("Unauthorized.");
  }

  return {
    fileName: resource.file_name,
    signedUrl: await createSignedUrl(admin, RESOURCE_BUCKET, resource.file_path)
  };
}

export async function getNotificationForUser(
  actor: SafeUser,
  notificationId: string
) {
  const admin = createSupabaseAdminClient();
  const recipient = await assertQuery<
    Database["public"]["Tables"]["notification_recipients"]["Row"] | null
  >(
    "Unable to validate notification access",
    admin
      .from("notification_recipients")
      .select("*")
      .eq("notification_id", notificationId)
      .eq("user_id", actor.id)
      .maybeSingle()
  );

  if (!recipient) {
    throw new Error("Notification not found.");
  }

  const notification = await assertQuery<NotificationRow>(
    "Unable to load notification",
    admin.from("notifications").select("*").eq("id", notificationId).single()
  );

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return mapNotification(notification, [actor.id]);
}
