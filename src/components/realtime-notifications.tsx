"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { requestJson } from "@/lib/client";
import type { NotificationRecord } from "@/lib/types";

interface RealtimeNotificationsProps {
  userId: string;
}

export function RealtimeNotifications({
  userId
}: RealtimeNotificationsProps) {
  const router = useRouter();
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`researchhub-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_recipients",
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const notificationId = String(payload.new.notification_id ?? "");

          if (!notificationId) {
            return;
          }

          try {
            const result = await requestJson<{ notification: NotificationRecord }>(
              `/api/notifications/${notificationId}`
            );

            setNotification(result.notification);
            router.refresh();

            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = window.setTimeout(() => {
              setNotification(null);
            }, 6000);
          } catch {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  if (!notification) {
    return null;
  }

  return (
    <div className="realtime-toast" role="status">
      <p className="eyebrow">Live Update</p>
      <strong>{notification.title}</strong>
      <p>{notification.message}</p>
    </div>
  );
}
