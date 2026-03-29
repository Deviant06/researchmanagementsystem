"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasswordUpdateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    async function hydrateSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setHasSession(Boolean(session));
      setChecking(false);
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(Boolean(session));
      }
    });

    void hydrateSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      setBusy(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("The password confirmation does not match.");
      setBusy(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    setStatus("Password updated successfully. Redirecting to your dashboard...");
    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return <p className="muted-copy">Checking your secure session...</p>;
  }

  if (!hasSession) {
    return (
      <div className="stack-md">
        <p className="form-error">
          This password link is no longer active. Open the latest password setup or
          reset email and try again.
        </p>
      </div>
    );
  }

  return (
    <form className="stack-lg" onSubmit={handleSubmit}>
      <label className="field">
        <span>New password</span>
        <input
          autoComplete="new-password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <label className="field">
        <span>Confirm new password</span>
        <input
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}

      <button className="button button-primary" disabled={busy} type="submit">
        {busy ? "Saving..." : "Save New Password"}
      </button>
    </form>
  );
}
