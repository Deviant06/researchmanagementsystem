import { APP_NAME, SCHOOL_NAME } from "@/lib/constants";
import { PasswordUpdateForm } from "@/components/password-update-form";

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">{SCHOOL_NAME}</p>
        <h1>{APP_NAME}</h1>
        <p className="auth-copy">
          Complete your secure password setup to access your research workspace,
          submissions, feedback, and revision checklist.
        </p>
      </section>

      <section className="auth-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Secure Password Setup</p>
            <h2>Choose your new password</h2>
          </div>
          <span className="badge badge-blue">Supabase Auth</span>
        </div>

        <PasswordUpdateForm />
      </section>
    </main>
  );
}
