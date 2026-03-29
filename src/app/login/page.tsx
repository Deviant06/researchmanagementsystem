import { redirect } from "next/navigation";

import { APP_NAME, ADMIN_TEMP_PASSWORD } from "@/lib/constants";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/server/auth";
import { hasSupabasePublicEnv } from "@/lib/server/supabase-env";

export const dynamic = "force-dynamic";

const demoAccounts = [
  {
    role: "Teacher Admin",
    email: "teacher@researchhub.local",
    password: ADMIN_TEMP_PASSWORD
  },
  {
    role: "Student Demo",
    email: "aira@researchhub.local",
    password: ADMIN_TEMP_PASSWORD
  }
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  const isConfigured = hasSupabasePublicEnv();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">Research Management for Senior High School</p>
        <h1>{APP_NAME}</h1>
        <p className="auth-copy">
          Guide research groups from title proposal to final defense with version
          tracking, structured feedback, revision checklists, analytics, and
          secure role-based access.
        </p>
        <div className="hero-grid">
          <article className="hero-card">
            <h3>Teacher Control Center</h3>
            <p>
              Create student accounts, assign groups, review drafts, convert
              comments into actionable revision tasks, and track delays across all
              stages.
            </p>
          </article>
          <article className="hero-card">
            <h3>Student Workspace</h3>
            <p>
              Submit new versions, monitor chapter progress, respond to feedback,
              and access templates, rubrics, and video guides in one place.
            </p>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Secure Access</p>
            <h2>Sign in to continue</h2>
          </div>
          <span className="badge badge-blue">Supabase Auth</span>
        </div>

        {isConfigured ? (
          <LoginForm />
        ) : (
          <div className="stack-md">
            <p className="form-error">
              Supabase is not configured yet. Add your project keys to
              `.env.local`, run the SQL migration, and seed the demo users before
              signing in.
            </p>
            <code className="env-snippet">
              NEXT_PUBLIC_SUPABASE_URL=...
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=...
              <br />
              SUPABASE_SERVICE_ROLE_KEY=...
            </code>
          </div>
        )}

        <div className="demo-accounts">
          <p className="demo-title">Demo accounts</p>
          {demoAccounts.map((account) => (
            <div className="demo-row" key={account.role}>
              <strong>{account.role}</strong>
              <span>{account.email}</span>
              <code>{account.password}</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
