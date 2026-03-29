"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestJson } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);

    try {
      await requestJson("/api/auth/logout", {
        method: "POST"
      });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="button button-ghost" disabled={busy} onClick={handleLogout}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
