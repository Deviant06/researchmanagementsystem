"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { requestJson } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";
import type { AdminDashboardData, SafeUser } from "@/lib/types";

interface StudentManagerProps {
  groups: AdminDashboardData["groups"];
  students: SafeUser[];
}

interface StudentFormState {
  name: string;
  email: string;
  groupName: string;
}

const emptyForm: StudentFormState = {
  name: "",
  email: "",
  groupName: ""
};

export function StudentManager({ groups, students }: StudentManagerProps) {
  const router = useRouter();
  const [createForm, setCreateForm] = useState<StudentFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<StudentFormState>(emptyForm);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const groupMap = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups]
  );

  async function createStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setNotice(null);

    try {
      const result = await requestJson<{ temporaryPassword: string }>(
        "/api/admin/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(createForm)
        }
      );

      setNotice(
        `Student account created. Temporary password: ${result.temporaryPassword}`
      );
      setCreateForm(emptyForm);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create student.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveStudent(studentId: string) {
    setBusyId(studentId);
    setNotice(null);

    try {
      await requestJson(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingForm)
      });

      setNotice("Student account updated.");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update student.");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(studentId: string) {
    setBusyId(studentId);
    setNotice(null);

    try {
      const result = await requestJson<{ temporaryPassword: string }>(
        `/api/admin/students/${studentId}/reset-password`,
        {
          method: "POST"
        }
      );

      setNotice(`Password reset. Temporary password: ${result.temporaryPassword}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteStudent(studentId: string) {
    const confirmed = window.confirm(
      "Delete this student account? Research records stay in the system, but the login will be removed."
    );

    if (!confirmed) {
      return;
    }

    setBusyId(studentId);
    setNotice(null);

    try {
      await requestJson(`/api/admin/students/${studentId}`, {
        method: "DELETE"
      });

      setNotice("Student account deleted.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  function startEditing(student: SafeUser) {
    setEditingId(student.id);
    setEditingForm({
      name: student.name,
      email: student.email,
      groupName: student.groupId ? groupMap.get(student.groupId) ?? "" : ""
    });
  }

  return (
    <div className="stack-lg">
      <article className="surface-card">
        <div className="section-heading">
          <div>
            <h3>Student Accounts</h3>
            <p>Create, edit, reassign, or remove student access.</p>
          </div>
        </div>

        {notice ? <p className="form-success">{notice}</p> : null}

        <form className="stack-sm" onSubmit={createStudent}>
          <div className="card-form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                name="name"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                required
                value={createForm.name}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                name="email"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
                required
                type="email"
                value={createForm.email}
              />
            </label>

            <label className="field">
              <span>Group</span>
              <input
                list="group-options"
                name="groupName"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    groupName: event.target.value
                  }))
                }
                placeholder="Group Newton"
                required
                value={createForm.groupName}
              />
            </label>
          </div>

          <datalist id="group-options">
            {groups.map((group) => (
              <option key={group.id} value={group.name} />
            ))}
          </datalist>

          <div className="form-actions">
            <button
              className="button button-primary"
              disabled={busyId === "create"}
              type="submit"
            >
              {busyId === "create" ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </article>

      <article className="surface-card">
        <div className="section-heading">
          <div>
            <h3>Current Students</h3>
            <p>Every student is tied to a group workspace with strict isolation.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Group</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    {editingId === student.id ? (
                      <input
                        className="table-input"
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            name: event.target.value
                          }))
                        }
                        value={editingForm.name}
                      />
                    ) : (
                      student.name
                    )}
                  </td>
                  <td>
                    {editingId === student.id ? (
                      <input
                        className="table-input"
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            email: event.target.value
                          }))
                        }
                        value={editingForm.email}
                      />
                    ) : (
                      student.email
                    )}
                  </td>
                  <td>
                    {editingId === student.id ? (
                      <input
                        className="table-input"
                        list="group-options"
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            groupName: event.target.value
                          }))
                        }
                        value={editingForm.groupName}
                      />
                    ) : (
                      groupMap.get(student.groupId ?? "") ?? "Unassigned"
                    )}
                  </td>
                  <td>{formatDateTime(student.lastLoginAt)}</td>
                  <td>
                    <div className="inline-actions">
                      {editingId === student.id ? (
                        <>
                          <button
                            className="button button-secondary"
                            disabled={busyId === student.id}
                            onClick={() => saveStudent(student.id)}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="button button-ghost"
                            onClick={() => setEditingId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button button-secondary"
                            onClick={() => startEditing(student)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="button button-secondary"
                            disabled={busyId === student.id}
                            onClick={() => resetPassword(student.id)}
                            type="button"
                          >
                            Reset Password
                          </button>
                          <button
                            className="button button-ghost"
                            disabled={busyId === student.id}
                            onClick={() => deleteStudent(student.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
