import { LogOut, UserRound } from "lucide-react";
import { useFinance } from "../context/FinanceContext";

export default function RoleSwitcher({ openProfile }) {
  const { currentUser, role, signOut } = useFinance();
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <section className="finova-card px-3 py-3">
      <button type="button" className="ledger-pass flex w-full items-center gap-3 text-left" aria-label="Open your profile card" onClick={openProfile}>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
          {currentUser.avatar ? <img className="h-10 w-10 rounded-xl object-cover" src={currentUser.avatar} alt="" /> : <UserRound className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--finova-text)]">
            {currentUser?.name ?? "Workspace User"}
          </p>
          <p className="truncate text-sm text-[var(--finova-muted)]">
            {formattedRole} · Profile card ↗
          </p>
        </div>
      </button>

      <div>
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
