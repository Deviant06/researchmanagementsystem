import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = "ResearchHub123!";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const STAGES = [
  { key: "title-proposal", dueOffsetDays: 5 },
  { key: "chapter-1", dueOffsetDays: 12 },
  { key: "chapter-2", dueOffsetDays: 20 },
  { key: "chapter-3", dueOffsetDays: 28 },
  { key: "data-gathering", dueOffsetDays: 36 },
  { key: "data-analysis", dueOffsetDays: 44 },
  { key: "chapter-4-5", dueOffsetDays: 52 },
  { key: "final-defense", dueOffsetDays: 60 }
];

const STUDENTS = [
  { email: "aira@researchhub.local", name: "Aira Santos" },
  { email: "noah@researchhub.local", name: "Noah Cruz" },
  { email: "leah@researchhub.local", name: "Leah Mendoza" },
  { email: "ethan@researchhub.local", name: "Ethan Reyes" },
  { email: "mia@researchhub.local", name: "Mia Delgado" }
];

function addDays(base, days) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function must(label, promise) {
  const { data, error } = await promise;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }

  return data;
}

async function ensureUser({ email, name, role }) {
  const existing = await supabase.auth.admin.listUsers();
  const found = existing.data.users.find((user) => user.email === email);

  if (found) {
    await must(
      `Updating auth user ${email}`,
      supabase.auth.admin.updateUserById(found.id, {
        password: demoPassword,
        email,
        email_confirm: true,
        user_metadata: {
          full_name: name
        },
        app_metadata: {
          role
        }
      })
    );

    return found.id;
  }

  const created = await must(
    `Creating auth user ${email}`,
    supabase.auth.admin.createUser({
      email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name
      },
      app_metadata: {
        role
      }
    })
  );

  return created.user.id;
}

async function main() {
  const teacherId = await ensureUser({
    email: "teacher@researchhub.local",
    name: "Prof. Veda Santiago",
    role: "ADMIN"
  });

  const studentAccounts = [];
  for (const student of STUDENTS) {
    const id = await ensureUser({
      email: student.email,
      name: student.name,
      role: "STUDENT"
    });
    studentAccounts.push({ ...student, id });
  }

  const groupRows = await must(
    "Creating group",
    supabase
      .from("groups")
      .upsert([{ name: "Group Veda" }], {
        onConflict: "name"
      })
      .select("*")
  );

  const group = groupRows[0];

  await must(
    "Upserting profiles",
    supabase.from("profiles").upsert([
      {
        id: teacherId,
        role: "ADMIN",
        name: "Prof. Veda Santiago",
        email: "teacher@researchhub.local",
        group_id: null,
        email_alerts: true
      },
      ...studentAccounts.map((student) => ({
        id: student.id,
        role: "STUDENT",
        name: student.name,
        email: student.email,
        group_id: group.id,
        email_alerts: true
      }))
    ])
  );

  await must(
    "Upserting stages",
    supabase.from("stages").upsert(
      STAGES.map((stage) => ({
        group_id: group.id,
        stage_key: stage.key,
        status:
          stage.key === "title-proposal"
            ? "APPROVED"
            : stage.key === "chapter-1"
              ? "REVISED"
              : stage.key === "chapter-2"
                ? "SUBMITTED"
                : "NOT_STARTED",
        due_date: addDays("2026-02-03T01:00:00.000Z", stage.dueOffsetDays),
        last_submission_at:
          stage.key === "title-proposal"
            ? "2026-02-08T09:15:00.000Z"
            : stage.key === "chapter-1"
              ? "2026-03-10T07:35:00.000Z"
              : stage.key === "chapter-2"
                ? "2026-03-21T10:30:00.000Z"
                : null,
        last_reviewed_at:
          stage.key === "title-proposal"
            ? "2026-02-10T10:00:00.000Z"
            : stage.key === "chapter-1"
              ? "2026-03-11T09:15:00.000Z"
              : null
      })),
      {
        onConflict: "group_id,stage_key"
      }
    )
  );

  await must(
    "Creating submissions",
    supabase.from("submissions").upsert(
      [
        {
          group_id: group.id,
          stage_key: "title-proposal",
          version: 1,
          submission_type: "TEXT",
          content:
            "Investigating guided study pods as a strategy for improving Grade 12 research writing confidence.",
          uploaded_by_user_id: studentAccounts[0].id,
          created_at: "2026-02-08T09:15:00.000Z"
        },
        {
          group_id: group.id,
          stage_key: "chapter-1",
          version: 1,
          submission_type: "TEXT",
          content:
            "Initial Chapter 1 draft covering the background of the study, research problem, and significance.",
          uploaded_by_user_id: studentAccounts[1].id,
          created_at: "2026-02-20T12:20:00.000Z"
        },
        {
          group_id: group.id,
          stage_key: "chapter-1",
          version: 2,
          submission_type: "TEXT",
          content:
            "Revised Chapter 1 draft with a clearer research gap and improved local context.",
          uploaded_by_user_id: studentAccounts[0].id,
          created_at: "2026-03-10T07:35:00.000Z"
        },
        {
          group_id: group.id,
          stage_key: "chapter-2",
          version: 1,
          submission_type: "TEXT",
          content:
            "Chapter 2 literature review draft focused on collaborative learning, study habits, and student motivation.",
          uploaded_by_user_id: studentAccounts[2].id,
          created_at: "2026-03-21T10:30:00.000Z"
        }
      ],
      {
        onConflict: "group_id,stage_key,version"
      }
    )
  );

  const commentRows = await must(
    "Creating comments",
    supabase
      .from("comments")
      .insert([
        {
          group_id: group.id,
          stage_key: "chapter-1",
          section: "RRL",
          category: "MAJOR_REVISION",
          text: "Expand the local literature review with at least three recent Philippine studies.",
          created_by_user_id: teacherId,
          created_at: "2026-03-11T09:00:00.000Z"
        },
        {
          group_id: group.id,
          stage_key: "chapter-1",
          section: "Conceptual Framework",
          category: "MINOR_REVISION",
          text: "Tighten the framework labels so they match the variables in the statement of the problem.",
          created_by_user_id: teacherId,
          created_at: "2026-03-11T09:15:00.000Z",
          addressed_at: "2026-03-13T06:45:00.000Z",
          addressed_by_user_id: studentAccounts[1].id
        }
      ])
      .select("*")
  );

  const rrlComment = commentRows.find((comment) => comment.section === "RRL");
  const frameworkComment = commentRows.find(
    (comment) => comment.section === "Conceptual Framework"
  );

  await must(
    "Creating comment replies",
    supabase.from("comment_replies").insert([
      {
        comment_id: rrlComment.id,
        user_id: studentAccounts[0].id,
        text: "We have already added two local studies and are searching for one more from a nearby school.",
        created_at: "2026-03-11T13:20:00.000Z"
      }
    ])
  );

  await must(
    "Creating tasks",
    supabase.from("tasks").upsert(
      [
        {
          group_id: group.id,
          stage_key: "chapter-1",
          comment_id: rrlComment.id,
          description:
            "Strengthen the local RRL and cite at least three recent Philippine studies.",
          status: "PENDING",
          student_response:
            "The team is collecting one campus-based and two regional references for the next revision.",
          created_at: "2026-03-11T09:00:00.000Z",
          updated_at: "2026-03-12T08:00:00.000Z"
        },
        {
          group_id: group.id,
          stage_key: "chapter-1",
          comment_id: frameworkComment.id,
          description:
            "Revise the conceptual framework illustration for clearer variable flow.",
          status: "COMPLETED",
          student_response:
            "Updated the framework and aligned the variable labels with the research questions.",
          created_at: "2026-03-11T09:15:00.000Z",
          updated_at: "2026-03-13T06:45:00.000Z"
        }
      ],
      {
        onConflict: "comment_id"
      }
    )
  );

  await must(
    "Creating resources",
    supabase.from("resources").upsert(
      [
        {
          category: "TEMPLATE",
          audience: "ALL",
          title: "Chapter 1 Template",
          description:
            "Standard senior high school Chapter 1 structure with prompts for each section.",
          file_name: null,
          file_path: null,
          external_url: null,
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-05T08:00:00.000Z"
        },
        {
          category: "RUBRIC",
          audience: "ALL",
          title: "Final Defense Rubric",
          description: "Teacher scoring rubric for the final defense presentation.",
          file_name: null,
          file_path: null,
          external_url: null,
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-06T08:30:00.000Z"
        },
        {
          category: "VIDEO_GUIDE",
          audience: "ALL",
          title: "How to Write a Strong RRL",
          description:
            "Short video guide on synthesizing sources instead of summarizing them.",
          external_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          file_name: null,
          file_path: null,
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-06T08:45:00.000Z"
        },
        {
          category: "TEMPLATE",
          audience: "ADMIN_ONLY",
          title: "Teacher Monitoring Sheet",
          description:
            "Internal teaching resource for tracking review cadence and intervention notes.",
          file_name: null,
          file_path: null,
          external_url: null,
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-07T09:15:00.000Z"
        }
      ],
      {
        onConflict: "title"
      }
    )
  );

  const notificationRows = await must(
    "Creating notifications",
    supabase
      .from("notifications")
      .insert([
        {
          type: "FEEDBACK",
          title: "Chapter 1 feedback posted",
          message: "Major revision notes were added to the RRL section.",
          group_id: group.id,
          stage_key: "chapter-1",
          created_at: "2026-03-11T09:00:00.000Z"
        },
        {
          type: "SUBMISSION",
          title: "Chapter 2 submitted",
          message: "Group Veda uploaded a new Chapter 2 draft for teacher review.",
          group_id: group.id,
          stage_key: "chapter-2",
          created_at: "2026-03-21T10:30:00.000Z"
        },
        {
          type: "STATUS",
          title: "Deadline reminder",
          message: "Chapter 3 is due in three days. Review pending tasks before the deadline.",
          group_id: group.id,
          stage_key: "chapter-3",
          created_at: "2026-03-24T08:00:00.000Z"
        }
      ])
      .select("*")
  );

  await must(
    "Creating notification recipients",
    supabase.from("notification_recipients").upsert([
      ...studentAccounts.map((student) => ({
        notification_id: notificationRows[0].id,
        user_id: student.id,
        created_at: "2026-03-11T09:00:00.000Z"
      })),
      {
        notification_id: notificationRows[1].id,
        user_id: teacherId,
        created_at: "2026-03-21T10:30:00.000Z"
      },
      ...studentAccounts.map((student) => ({
        notification_id: notificationRows[2].id,
        user_id: student.id,
        created_at: "2026-03-24T08:00:00.000Z"
      }))
    ])
  );

  console.log("Supabase demo data seeded successfully.");
  console.log("Teacher login: teacher@researchhub.local / ResearchHub123!");
  console.log("Student demo login: aira@researchhub.local / ResearchHub123!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
