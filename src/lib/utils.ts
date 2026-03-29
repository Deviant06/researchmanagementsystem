import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { StageStatus } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getStatusLabel(status: StageStatus) {
  return STATUS_LABELS[status];
}

export function getStatusTone(status: StageStatus) {
  return STATUS_COLORS[status];
}

export function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

export function isAllowedDocument(fileName: string) {
  return /\.(pdf|docx)$/i.test(fileName);
}

export function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
