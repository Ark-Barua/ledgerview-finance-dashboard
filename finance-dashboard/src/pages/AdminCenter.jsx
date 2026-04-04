import { Lock, ShieldCheck, UserCog } from "lucide-react";
import { useFinance } from "../context/FinanceContext";

export default function AdminCenter() {
  const { role, workspaceUsers } = useFinance();

  if (role !== "admin") {
    return (
      <section className="finova-card px-6 py-12 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[var(--finova-text)]">
            Admin access required
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--finova-muted)]">
            Admin Center controls workspace policy and access assignments, so it
            stays hidden from viewers.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <p className="text-lg font-semibold text-[var(--finova-text)]">
          Admin Center
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
          Monitor RBAC policies, audit workspace access, and review who has
          elevated permissions.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="finova-card px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
              <UserCog className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--finova-text)]">
                Access directory
              </p>
              <p className="text-sm text-[var(--finova-muted)]">
                Current registered workspace users
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {workspaceUsers.map((user) => (
              <article
                key={user.id}
                className="finova-card-soft flex items-center justify-between gap-4 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--finova-text)]">
                    {user.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--finova-muted)]">
                    {user.email}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    user.role === "admin"
                      ? "bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]"
                      : "bg-[#eef8ff] text-[#59aee6]"
                  }`}
                >
                  {user.role}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="finova-card px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--finova-text)]">
                RBAC policy
              </p>
              <p className="text-sm text-[var(--finova-muted)]">
                Current workspace rule set
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <article className="finova-card-soft px-4 py-4">
              <p className="text-sm font-semibold text-[var(--finova-text)]">
                Viewer
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
                Can access Dashboard, Asset Graph, Events, Finance, Members,
                File Manager, and Document in read-only mode.
              </p>
            </article>

            <article className="finova-card-soft px-4 py-4">
              <p className="text-sm font-semibold text-[var(--finova-text)]">
                Admin
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
                Can access every page and use editing flows like transaction
                creation, transaction editing, file uploads, and report runs.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
