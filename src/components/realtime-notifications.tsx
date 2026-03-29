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
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }

    setBrowserPermission(window.Notification.permission);

    if (window.Notification.permission === "default") {
      void window.Notification.requestPermission().then((permission) => {
        setBrowserPermission(permission);
      });
    }
  }, []);

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
            if ("Notification" in window && window.Notification.permission === "granted") {
              const browserNotice = new window.Notification(result.notification.title, {
                body: result.notification.message,
                tag: result.notification.id
              });

              browserNotice.onclick = () => {
                window.focus();
                browserNotice.close();
              };
            }
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
      {browserPermission === "denied" ? (
        <p className="muted-copy">Browser alerts are blocked in this browser.</p>
      ) : null}
    </div>
  );
}
