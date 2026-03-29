import { getStatusLabel, getStatusTone } from "@/lib/utils";
import { COMMENT_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CommentCategory, StageStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: StageStatus }) {
  return (
    <span className={cn("badge", `badge-${getStatusTone(status)}`)}>
      {getStatusLabel(status)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: CommentCategory }) {
  const tone =
    category === "APPROVED"
      ? "green"
      : category === "MINOR_REVISION"
        ? "yellow"
        : "red";

  return <span className={cn("badge", `badge-${tone}`)}>{COMMENT_CATEGORY_LABELS[category]}</span>;
}
