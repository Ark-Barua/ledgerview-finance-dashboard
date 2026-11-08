import { ArrowRight } from "lucide-react";
import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { useFinance } from "../context/FinanceContext";

import { hasLegacyWorkspace, readLegacyWorkspace } from "../utils/legacyWorkspace";

const authModes = {
  signIn: {
    label: "Sign In",
    heading: "Welcome back.",
    description: "Sign in to your finance workspace.",
  },
  signUp: {
    label: "Sign Up",
    heading: "Open an account.",
    description: "Create a private workspace. You can add members after signing up.",
  },
};

function createEmptyForm() {
  return {
    name: "",
    email: "",
    password: "",
  };
}

export default function AuthScreen() {
  const { signIn, signUp } = useFinance();
  const [mode, setMode] = useState("signIn");
  const [formState, setFormState] = useState(createEmptyForm);
  const [statusMessage, setStatusMessage] = useState("");

  const [importLegacy, setImportLegacy] = useState(false);
  const [hasLegacy] = useState(hasLegacyWorkspace);
  const [pending, setPending] = useState(false);
  const activeMode = authModes[mode];

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const result = mode === "signIn"
        ? await signIn({ email: formState.email, password: formState.password })
        : await signUp({ ...formState, legacy: importLegacy ? readLegacyWorkspace() : undefined });
      if (!result.success) setStatusMessage(result.message);
    } catch {
      setStatusMessage("The saved workspace could not be imported. Check your browser data or create a fresh workspace.");
    } finally { setPending(false); }
  };

  return (
    <main className="entry">
      <section className="ledger-cover">
        <BrandLogo />
        <div className="cover-art" aria-hidden="true">
          <div className="engraving">{Array.from({ length: 76 }, (_, index) =>
            <i key={index} style={{ transform: `rotate(${index * 180 / 76}deg)` }} />
          )}</div>
        </div>
        <div className="cover-title"><span className="ledger-label">Finance workspace</span>
          <h1>The <em>Ledger.</em></h1>
        </div>
        <div className="cover-foot"><span>LedgerView</span><span>Financial operations</span></div>
      </section>

      <section className="entry-panel">
        <div className="entry-content">
          <div className="entry-tabs">
            {Object.entries(authModes).map(([modeKey, authMode]) => (
              <button
                key={modeKey}
                aria-pressed={mode === modeKey}
                type="button"
                onClick={() => {
                  setMode(modeKey);
                  setStatusMessage("");
                }}
              >
                {authMode.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="entry-heading">
              {activeMode.heading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              {activeMode.description}
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === "signUp" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--finova-text)]">
                  Full name
                </span>
                <input
                  className="h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)]"
                  name="name"
                  placeholder="Full name"
                  type="text"
                  value={formState.name}
                  onChange={handleFieldChange}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--finova-text)]">
                Email
              </span>
              <input
                className="h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)]"
                required autoComplete="username" name="email"
                placeholder="Email address"
                type="email"
                value={formState.email}
                onChange={handleFieldChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--finova-text)]">
                Password
              </span>
              <input
                className="h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)]"
                required autoComplete={mode === "signIn" ? "current-password" : "new-password"} name="password"
                minLength={mode === "signUp" ? 12 : undefined}
                maxLength={256}
                placeholder={mode === "signUp" ? "At least 12 characters" : "Password"}
                type="password"
                value={formState.password}
                onChange={handleFieldChange}
              />
            </label>

            {mode === "signUp" && hasLegacy && <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={importLegacy} onChange={event => setImportLegacy(event.target.checked)} />
              Import financial records saved in this browser into my new workspace
            </label>}

            <div role="alert" className="text-sm text-[var(--finova-danger)]">
              {statusMessage || null}
            </div>

            <button
              disabled={pending} className="entry-submit"
              type="submit"
            >
              {mode === "signIn" ? "Enter workspace" : "Create account"} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
