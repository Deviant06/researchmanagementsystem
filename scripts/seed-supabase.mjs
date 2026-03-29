import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tempPassword = "ResearchHub123!";

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
  { key: "title-proposal", label: "Title Proposal", dueOffsetDays: 5 },
  { key: "chapter-1", label: "Chapter 1", dueOffsetDays: 12 },
  { key: "chapter-2", label: "Chapter 2", dueOffsetDays: 20 },
  { key: "chapter-3", label: "Chapter 3", dueOffsetDays: 28 },
  { key: "data-gathering", label: "Data Gathering", dueOffsetDays: 36 },
  { key: "data-analysis", label: "Data Analysis", dueOffsetDays: 44 },
  { key: "chapter-4-5", label: "Chapter 4-5", dueOffsetDays: 52 },
  { key: "final-defense", label: "Final Defense", dueOffsetDays: 60 }
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
        password: tempPassword,
        email,
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
      password: tempPassword,
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
    name: "Prof. Mae Tancu",
    role: "ADMIN"
  });
  const airaId = await ensureUser({
    email: "aira@researchhub.local",
    name: "Aira Santos",
    role: "STUDENT"
  });
  const noahId = await ensureUser({
    email: "noah@researchhub.local",
    name: "Noah Cruz",
    role: "STUDENT"
  });
  const leahId = await ensureUser({
    email: "leah@researchhub.local",
    name: "Leah Mendoza",
    role: "STUDENT"
  });

  const groupRows = await must(
    "Creating groups",
    supabase
      .from("groups")
      .upsert([{ name: "Group Newton" }, { name: "Group Curie" }], {
        onConflict: "name"
      })
      .select("*")
  );

  const groupNewton = groupRows.find((group) => group.name === "Group Newton");
  const groupCurie = groupRows.find((group) => group.name === "Group Curie");

  await must(
    "Upserting profiles",
    supabase.from("profiles").upsert([
      {
        id: teacherId,
        role: "ADMIN",
        name: "Prof. Mae Tancu",
        email: "teacher@researchhub.local",
        group_id: null,
        email_alerts: true
      },
      {
        id: airaId,
        role: "STUDENT",
        name: "Aira Santos",
        email: "aira@researchhub.local",
        group_id: groupNewton.id,
        email_alerts: true
      },
      {
        id: noahId,
        role: "STUDENT",
        name: "Noah Cruz",
        email: "noah@researchhub.local",
        group_id: groupNewton.id,
        email_alerts: true
      },
      {
        id: leahId,
        role: "STUDENT",
        name: "Leah Mendoza",
        email: "leah@researchhub.local",
        group_id: groupCurie.id,
        email_alerts: true
      }
    ])
  );

  const stageSeed = [
    ...STAGES.map((stage) => ({
      group_id: groupNewton.id,
      stage_key: stage.key,
      status:
        stage.key === "title-proposal"
          ? "APPROVED"
          : stage.key === "chapter-1"
            ? "REVISED"
            : stage.key === "chapter-2"
              ? "SUBMITTED"
              : "NOT_STARTED",
      due_date: addDays("2026-02-01T09:00:00.000Z", stage.dueOffsetDays),
      last_submission_at:
        stage.key === "title-proposal"
          ? "2026-02-08T09:15:00.000Z"
          : stage.key === "chapter-1"
            ? "2026-03-10T07:35:00.000Z"
            : null,
      last_reviewed_at:
        stage.key === "title-proposal"
          ? "2026-02-10T10:00:00.000Z"
          : stage.key === "chapter-1"
            ? "2026-03-11T09:15:00.000Z"
            : null
    })),
    ...STAGES.map((stage) => ({
      group_id: groupCurie.id,
      stage_key: stage.key,
      status:
        stage.key === "title-proposal" || stage.key === "chapter-1"
          ? "APPROVED"
          : stage.key === "chapter-2"
            ? "UNDER_REVIEW"
            : "NOT_STARTED",
      due_date: addDays("2026-02-07T09:00:00.000Z", stage.dueOffsetDays),
      last_submission_at:
        stage.key === "chapter-2" ? "2026-03-18T10:30:00.000Z" : null,
      last_reviewed_at:
        stage.key === "chapter-2" ? "2026-03-20T10:00:00.000Z" : null
    }))
  ];

  await must(
    "Upserting stages",
    supabase.from("stages").upsert(stageSeed, {
      onConflict: "group_id,stage_key"
    })
  );

  const submissionRows = await must(
    "Creating submissions",
    supabase
      .from("submissions")
      .upsert(
        [
          {
            group_id: groupNewton.id,
            stage_key: "title-proposal",
            version: 1,
            submission_type: "TEXT",
            content:
              "Investigating gamified review strategies to improve STEM readiness among Grade 12 learners.",
            uploaded_by_user_id: airaId,
            created_at: "2026-02-08T09:15:00.000Z"
          },
          {
            group_id: groupNewton.id,
            stage_key: "chapter-1",
            version: 1,
            submission_type: "TEXT",
            content:
              "Initial Chapter 1 draft covering background of the study, statement of the problem, and significance.",
            uploaded_by_user_id: noahId,
            created_at: "2026-02-20T12:20:00.000Z"
          },
          {
            group_id: groupNewton.id,
            stage_key: "chapter-1",
            version: 2,
            submission_type: "TEXT",
            content:
              "Revised Chapter 1 draft with stronger research gap articulation and expanded local literature context.",
            uploaded_by_user_id: airaId,
            created_at: "2026-03-10T07:35:00.000Z"
          },
          {
            group_id: groupCurie.id,
            stage_key: "chapter-2",
            version: 1,
            submission_type: "TEXT",
            content:
              "Chapter 2 literature review draft focused on social media use and time-management behavior among students.",
            uploaded_by_user_id: leahId,
            created_at: "2026-03-18T10:30:00.000Z"
          }
        ],
        {
          onConflict: "group_id,stage_key,version"
        }
      )
      .select("*")
  );

  const commentRows = await must(
    "Creating comments",
    supabase
      .from("comments")
      .insert([
        {
          group_id: groupNewton.id,
          stage_key: "chapter-1",
          section: "RRL",
          category: "MAJOR_REVISION",
          text: "The review lacks enough local studies. Expand the discussion before resubmitting.",
          created_by_user_id: teacherId,
          created_at: "2026-03-11T09:00:00.000Z"
        },
        {
          group_id: groupNewton.id,
          stage_key: "chapter-1",
          section: "Conceptual Framework",
          category: "MINOR_REVISION",
          text: "The framework is improving. Tighten the arrows and rename the constructs for consistency.",
          created_by_user_id: teacherId,
          created_at: "2026-03-11T09:15:00.000Z",
          addressed_at: "2026-03-13T06:45:00.000Z",
          addressed_by_user_id: noahId
        },
        {
          group_id: groupCurie.id,
          stage_key: "chapter-2",
          section: "Synthesis",
          category: "MINOR_REVISION",
          text: "The synthesis is promising, but it still reads like a summary. Show the exact gap your study addresses.",
          created_by_user_id: teacherId,
          created_at: "2026-03-20T10:00:00.000Z"
        }
      ])
      .select("*")
  );

  const rrlComment = commentRows.find((comment) => comment.section === "RRL");
  const frameworkComment = commentRows.find(
    (comment) => comment.section === "Conceptual Framework"
  );
  const synthesisComment = commentRows.find(
    (comment) => comment.section === "Synthesis"
  );

  await must(
    "Creating comment replies",
    supabase.from("comment_replies").insert([
      {
        comment_id: rrlComment.id,
        user_id: airaId,
        text: "We already found additional local references and will add them to the next version.",
        created_at: "2026-03-11T13:20:00.000Z"
      }
    ])
  );

  await must(
    "Creating tasks",
    supabase.from("tasks").upsert(
      [
        {
          group_id: groupNewton.id,
          stage_key: "chapter-1",
          comment_id: rrlComment.id,
          description:
            "Strengthen the local RRL and cite at least three recent Philippine studies.",
          status: "PENDING",
          student_response:
            "We are collecting two campus-based and one regional study for the next revision.",
          created_at: "2026-03-11T09:00:00.000Z",
          updated_at: "2026-03-12T08:00:00.000Z"
        },
        {
          group_id: groupNewton.id,
          stage_key: "chapter-1",
          comment_id: frameworkComment.id,
          description:
            "Revise the conceptual framework illustration for clearer variable flow.",
          status: "COMPLETED",
          student_response:
            "Updated the framework and aligned the labels with the statement of the problem.",
          created_at: "2026-03-11T09:15:00.000Z",
          updated_at: "2026-03-13T06:45:00.000Z"
        },
        {
          group_id: groupCurie.id,
          stage_key: "chapter-2",
          comment_id: synthesisComment.id,
          description:
            "Reorganize the synthesis section to show the gap between productivity tools and academic stress.",
          status: "PENDING",
          student_response: null,
          created_at: "2026-03-20T10:00:00.000Z",
          updated_at: "2026-03-20T10:00:00.000Z"
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
          title: "Chapter 1 Template",
          description:
            "Standard senior high school Chapter 1 structure with section prompts.",
          file_name: null,
          file_path: null,
          external_url: null,
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-05T08:00:00.000Z"
        },
        {
          category: "RUBRIC",
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
          title: "How to Write a Strong RRL",
          description:
            "Short video guide on synthesizing sources instead of summarizing them.",
          file_name: null,
          file_path: null,
          external_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          uploaded_by_user_id: teacherId,
          created_at: "2026-03-06T08:45:00.000Z"
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
          message: "Your teacher left major revision notes on the RRL section.",
          group_id: groupNewton.id,
          stage_key: "chapter-1",
          created_at: "2026-03-11T09:00:00.000Z"
        },
        {
          type: "REVISION_TASK",
          title: "Revision task assigned",
          message: "A new synthesis revision task was added to Chapter 2.",
          group_id: groupCurie.id,
          stage_key: "chapter-2",
          created_at: "2026-03-20T10:00:00.000Z"
        },
        {
          type: "SUBMISSION",
          title: "Chapter 2 submitted",
          message: "Group Curie uploaded a new Chapter 2 draft for review.",
          group_id: groupCurie.id,
          stage_key: "chapter-2",
          created_at: "2026-03-18T10:30:00.000Z"
        }
      ])
      .select("*")
  );

  await must(
    "Creating notification recipients",
    supabase.from("notification_recipients").upsert([
      {
        notification_id: notificationRows[0].id,
        user_id: airaId,
        created_at: "2026-03-11T09:00:00.000Z"
      },
      {
        notification_id: notificationRows[0].id,
        user_id: noahId,
        created_at: "2026-03-11T09:00:00.000Z"
      },
      {
        notification_id: notificationRows[1].id,
        user_id: leahId,
        created_at: "2026-03-20T10:00:00.000Z"
      },
      {
        notification_id: notificationRows[2].id,
        user_id: teacherId,
        created_at: "2026-03-18T10:30:00.000Z"
      }
    ])
  );

  console.log("Supabase demo data seeded successfully.");
  console.log("Teacher login: teacher@researchhub.local / ResearchHub123!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
