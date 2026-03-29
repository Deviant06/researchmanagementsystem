export type Role = "ADMIN" | "STUDENT";

export type StageKey =
  | "title-proposal"
  | "chapter-1"
  | "chapter-2"
  | "chapter-3"
  | "data-gathering"
  | "data-analysis"
  | "chapter-4-5"
  | "final-defense";

export type StageStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISED"
  | "APPROVED";

export type SubmissionType = "FILE" | "TEXT";

export type CommentCategory = "MAJOR_REVISION" | "MINOR_REVISION" | "APPROVED";

export type TaskStatus = "PENDING" | "COMPLETED";

export type ResourceCategory =
  | "TEMPLATE"
  | "RUBRIC"
  | "SAMPLE_PAPER"
  | "VIDEO_GUIDE";

export type NotificationType =
  | "FEEDBACK"
  | "REVISION_TASK"
  | "RESOURCE"
  | "STATUS"
  | "SUBMISSION";

export interface UserRecord {
  id: string;
  role: Role;
  name: string;
  email: string;
  groupId: string | null;
  emailAlertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface GroupRecord {
  id: string;
  name: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StageRecord {
  id: string;
  groupId: string;
  stageKey: StageKey;
  status: StageStatus;
  dueDate: string;
  updatedAt: string;
  lastSubmissionAt: string | null;
  lastReviewedAt: string | null;
}

export interface SubmissionRecord {
  id: string;
  groupId: string;
  stageKey: StageKey;
  version: number;
  submissionType: SubmissionType;
  fileName: string | null;
  filePath: string | null;
  content: string | null;
  uploadedByUserId: string;
  createdAt: string;
}

export interface CommentReplyRecord {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface CommentRecord {
  id: string;
  groupId: string;
  stageKey: StageKey;
  section: string;
  category: CommentCategory;
  text: string;
  createdByUserId: string;
  createdAt: string;
  addressedAt: string | null;
  addressedByUserId: string | null;
  replies: CommentReplyRecord[];
  taskId: string | null;
}

export interface TaskRecord {
  id: string;
  groupId: string;
  stageKey: StageKey;
  commentId: string;
  description: string;
  status: TaskStatus;
  studentResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRecord {
  id: string;
  category: ResourceCategory;
  title: string;
  description: string;
  fileName: string | null;
  filePath: string | null;
  externalUrl: string | null;
  uploadedByUserId: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetUserIds: string[];
  groupId: string | null;
  stageKey: StageKey | null;
  createdAt: string;
}

export interface NotificationRecipientRecord {
  notificationId: string;
  userId: string;
  createdAt: string;
  readAt: string | null;
}

export type SafeUser = UserRecord;

export interface EnrichedSubmission extends SubmissionRecord {
  uploaderName: string;
}

export interface EnrichedCommentReply extends CommentReplyRecord {
  userName: string;
}

export interface EnrichedComment extends CommentRecord {
  createdByName: string;
  replies: EnrichedCommentReply[];
}

export interface EnrichedTask extends TaskRecord {
  comment?: EnrichedComment;
}

export interface EnrichedStage extends StageRecord {
  label: string;
  submissions: EnrichedSubmission[];
  comments: EnrichedComment[];
  tasks: EnrichedTask[];
  progressScore: number;
  isLate: boolean;
}

export interface GroupWorkspace extends GroupRecord {
  students: SafeUser[];
  stages: EnrichedStage[];
  progressPercent: number;
  pendingTasks: number;
  lateStages: number;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
  color?: string;
}

export interface AdminAnalytics {
  completionRate: number;
  stageStatusBreakdown: AnalyticsPoint[];
  commonDelays: AnalyticsPoint[];
  revisionIssues: AnalyticsPoint[];
  submissionFrequency: AnalyticsPoint[];
}

export interface AdminDashboardData {
  currentUser: SafeUser;
  students: SafeUser[];
  groups: GroupWorkspace[];
  resources: ResourceRecord[];
  notifications: NotificationRecord[];
  analytics: AdminAnalytics;
}

export interface StudentDashboardData {
  currentUser: SafeUser;
  group: GroupWorkspace | null;
  resources: ResourceRecord[];
  notifications: NotificationRecord[];
  pendingSubmissions: number;
  feedbackCount: number;
  revisionTasks: number;
}
