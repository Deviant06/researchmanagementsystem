"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestJson } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await requestJson("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        })
      });

      router.push("/dashboard");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stack-lg" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          defaultValue="teacher@researchhub.local"
          name="email"
          placeholder="teacher@researchhub.local"
          required
          type="email"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          defaultValue="ResearchHub123!"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button button-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
