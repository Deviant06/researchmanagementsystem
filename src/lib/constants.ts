import type {
  CommentCategory,
  ResourceCategory,
  StageKey,
  StageStatus
} from "@/lib/types";

export const APP_NAME = "ResearchHub TANCU";

export const RESEARCH_STAGES: Array<{
  key: StageKey;
  label: string;
  dueOffsetDays: number;
}> = [
  { key: "title-proposal", label: "Title Proposal", dueOffsetDays: 5 },
  { key: "chapter-1", label: "Chapter 1", dueOffsetDays: 12 },
  { key: "chapter-2", label: "Chapter 2", dueOffsetDays: 20 },
  { key: "chapter-3", label: "Chapter 3", dueOffsetDays: 28 },
  { key: "data-gathering", label: "Data Gathering", dueOffsetDays: 36 },
  { key: "data-analysis", label: "Data Analysis", dueOffsetDays: 44 },
  { key: "chapter-4-5", label: "Chapter 4-5", dueOffsetDays: 52 },
  { key: "final-defense", label: "Final Defense", dueOffsetDays: 60 }
];

export const STATUS_PROGRESS: Record<StageStatus, number> = {
  NOT_STARTED: 0,
  SUBMITTED: 40,
  UNDER_REVIEW: 60,
  REVISED: 75,
  APPROVED: 100
};

export const STATUS_LABELS: Record<StageStatus, string> = {
  NOT_STARTED: "Not Started",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  REVISED: "Revision Needed",
  APPROVED: "Approved"
};

export const STATUS_COLORS: Record<StageStatus, string> = {
  NOT_STARTED: "slate",
  SUBMITTED: "red",
  UNDER_REVIEW: "blue",
  REVISED: "yellow",
  APPROVED: "green"
};

export const COMMENT_CATEGORY_LABELS: Record<CommentCategory, string> = {
  MAJOR_REVISION: "Major Revision",
  MINOR_REVISION: "Minor Revision",
  APPROVED: "Approved"
};

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  TEMPLATE: "Template",
  RUBRIC: "Rubric",
  SAMPLE_PAPER: "Sample Paper",
  VIDEO_GUIDE: "Video Guide"
};

export const ADMIN_TEMP_PASSWORD = "ResearchHub123!";
