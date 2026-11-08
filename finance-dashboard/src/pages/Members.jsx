import {
  Mail,
  PlusCircle,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useFinance } from "../context/FinanceContext";

function createEmptyMemberDraft() {
  return {
    name: "",
    email: "",
    password: "",
    role: "viewer",
  };
}

export default function Members() {
  const { deleteMember, inviteMember, role, workspaceUsers } = useFinance();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberDraft, setMemberDraft] = useState(createEmptyMemberDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = role === "admin";

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setMemberDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await inviteMember(memberDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage(result.message);
    setMemberDraft(createEmptyMemberDraft());
    setIsInviteOpen(false);
  };

  const handleDeleteMember = async (memberId) => {
    const shouldDelete = window.confirm(
      "Delete this member account? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const result = await deleteMember(memberId);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("Member removed from the workspace.");
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Workspace members
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              See who has viewer or admin access across the finance workspace.
            </p>
          </div>

          {isAdmin ? (
            <button
              className="finova-action-button finova-action-button--primary"
              type="button"
              onClick={() => {
                setStatusMessage("");
                setIsInviteOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Invite member
            </button>
          ) : null}
        </div>

        {isAdmin && isInviteOpen ? (
          <form
            className="finova-card-soft mt-5 grid gap-3 p-4 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Full name
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="name"
                placeholder="Full name"
                type="text"
                value={memberDraft.name}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Email
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="email"
                placeholder="Email address"
                type="email"
                value={memberDraft.email}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Account password
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="password"
                minLength={12} maxLength={256} placeholder="At least 12 characters"
                type="password"
                value={memberDraft.password}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Role
              </span>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="role"
                value={memberDraft.role}
                onChange={handleDraftChange}
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-6 text-sm text-[var(--finova-danger)]">
                  {statusMessage || null}
                </div>

                <div className="finova-action-group">
                  <button
                    className="finova-action-button"
                    type="button"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setStatusMessage("");
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    className="finova-action-button finova-action-button--primary"
                    type="submit"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Save Member
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {workspaceUsers.map((member) => (
          <article key={member.id} className="finova-card px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold text-[var(--finova-text)]">
                    {member.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[var(--finova-muted)]">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  member.role === "admin"
                    ? "bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]"
                    : "bg-[#eef8ff] text-[#59aee6]"
                }`}
              >
                {member.role}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-[var(--finova-bg-soft)] px-4 py-3 text-sm text-[var(--finova-muted)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--finova-accent)]" />
                  {member.role === "admin"
                    ? "Full access to all pages and editing controls"
                    : "Read-only access to operational viewer pages"}
                </div>

                {isAdmin ? (
                  <button
                    className="finova-action-button finova-action-button--danger finova-action-button--sm"
                    type="button"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
