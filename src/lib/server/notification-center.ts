import type { SupabaseClient } from "@supabase/supabase-js";

import { sendNotificationEmailAlerts } from "@/lib/server/email";
import type { Database } from "@/lib/server/supabase-types";
import type { NotificationRecord, NotificationType, StageKey } from "@/lib/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  targetUserIds: string[];
  groupId: string | null;
  stageKey: StageKey | null;
}

async function assertMutation(
  label: string,
  promise: any
) {
  const result = await promise;

  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

export async function createNotification(
  admin: SupabaseClient<Database>,
  input: CreateNotificationInput
): Promise<NotificationRecord> {
  const inserted = (await assertMutation(
    "Unable to create notification",
    admin
      .from("notifications")
      .insert({
        type: input.type,
        title: input.title,
        message: input.message,
        group_id: input.groupId,
        stage_key: input.stageKey
      })
      .select("*")
      .single()
  )) as Database["public"]["Tables"]["notifications"]["Row"];

  const uniqueUserIds = Array.from(new Set(input.targetUserIds));

  if (uniqueUserIds.length > 0) {
    await assertMutation(
      "Unable to assign notification recipients",
      admin.from("notification_recipients").insert(
        uniqueUserIds.map((userId) => ({
          notification_id: inserted.id,
          user_id: userId
        }))
      )
    );

    try {
      const recipients = (await assertMutation(
        "Unable to load notification recipients",
        admin
          .from("profiles")
          .select("id, email, name, email_alerts")
          .in("id", uniqueUserIds)
      )) as Pick<ProfileRow, "id" | "email" | "name" | "email_alerts">[];

      await sendNotificationEmailAlerts({
        recipients: recipients
          .filter((recipient) => recipient.email_alerts)
          .map((recipient) => ({
            email: recipient.email,
            name: recipient.name
          })),
        title: input.title,
        message: input.message,
        actionUrl: process.env.APP_BASE_URL
      });
    } catch (error) {
      console.error("Notification email delivery failed:", error);
    }
  }

  return {
    id: inserted.id,
    type: inserted.type,
    title: inserted.title,
    message: inserted.message,
    targetUserIds: uniqueUserIds,
    groupId: inserted.group_id,
    stageKey: inserted.stage_key,
    createdAt: inserted.created_at
  };
}
