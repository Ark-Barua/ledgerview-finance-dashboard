import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useFinance } from "../context/FinanceContext";

export default function RoleSwitcher() {
  const { currentUser, role, signOut } = useFinance();
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <section className="finova-card px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
          <UserRound className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--finova-text)]">
            {currentUser?.name ?? "Workspace User"}
          </p>
          <p className="truncate text-sm text-[var(--finova-muted)]">
            {currentUser?.email ?? "user@ledgerview.app"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--finova-muted)]">
              Workspace role
            </p>
            <div className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-[var(--finova-text)]">
              <ShieldCheck className="h-4 w-4 text-[var(--finova-accent)]" />
              {formattedRole} access
            </div>
          </div>

          <span className="rounded-full border border-[var(--finova-border)] bg-[var(--finova-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--finova-accent)] shadow-[0_12px_24px_-24px_rgba(30,35,65,0.35)]">
            {formattedRole}
          </span>
        </div>

        <button
          className="finova-action-button finova-action-button--secondary finova-action-button--sm mt-3 w-full justify-center"
          type="button"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </section>
  );
}
