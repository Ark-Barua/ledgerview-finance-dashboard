import { LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import { useFinance } from "../context/FinanceContext";

const AUTH_UI_STORAGE_KEY = "finance-dashboard:auth-ui";

const authModes = {
  signIn: {
    label: "Sign In",
    icon: LockKeyhole,
    heading: "Welcome back",
    description: "Access the LedgerView workspace with your saved account.",
  },
  signUp: {
    label: "Sign Up",
    icon: UserPlus,
    heading: "Create your workspace account",
    description: "Register a viewer or admin account for this RBAC simulation.",
  },
};

function createEmptyForm() {
  return {
    name: "",
    email: "",
    password: "",
    role: "viewer",
  };
}

function readAuthUiState() {
  if (typeof window === "undefined") {
    return {
      mode: "signIn",
      formState: createEmptyForm(),
    };
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_UI_STORAGE_KEY);

    if (!storedValue) {
      return {
        mode: "signIn",
        formState: createEmptyForm(),
      };
    }

    const parsedValue = JSON.parse(storedValue);

    return {
      mode: parsedValue.mode === "signUp" ? "signUp" : "signIn",
      formState: {
        ...createEmptyForm(),
        email: parsedValue.formState?.email ?? "",
        role: parsedValue.formState?.role === "admin" ? "admin" : "viewer",
      },
    };
  } catch {
    return {
      mode: "signIn",
      formState: createEmptyForm(),
    };
  }
}

export default function AuthScreen() {
  const { signIn, signUp } = useFinance();
  const [mode, setMode] = useState(() => readAuthUiState().mode);
  const [formState, setFormState] = useState(() => readAuthUiState().formState);
  const [statusMessage, setStatusMessage] = useState("");

  const activeMode = authModes[mode];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Keep the auth screen predictable across refreshes without storing passwords.
    window.localStorage.setItem(
      AUTH_UI_STORAGE_KEY,
      JSON.stringify({
        mode,
        formState: {
          email: formState.email,
          role: formState.role,
        },
      }),
    );
  }, [formState.email, formState.role, mode]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result =
      mode === "signIn"
        ? signIn({
            email: formState.email,
            password: formState.password,
          })
        : signUp(formState);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("");
    setFormState(createEmptyForm());

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        AUTH_UI_STORAGE_KEY,
        JSON.stringify({
          mode: "signIn",
          formState: {
            email: mode === "signUp" ? formState.email : "",
            role: "viewer",
          },
        }),
      );
    }
  };

  return (
    <main className="finova-shell flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
      <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
        <section className="finova-card relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[var(--finova-accent)]" />

          <BrandLogo
            align="start"
            className="sm:max-w-[420px]"
            size="hero"
            stackOnMobile
          />

          <p className="mt-8 max-w-xl text-sm leading-7 text-[var(--finova-muted)]">
            Sign in as an existing admin or viewer, or create a new account to
            experience role-based access control across the finance suite.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="finova-card-soft p-4">
              <p className="text-sm font-semibold text-[var(--finova-text)]">
                Demo admin
              </p>
              <p className="mt-2 text-sm text-[var(--finova-muted)]">
                Email: <span className="font-medium text-[var(--finova-text)]">admin@ledgerview.app</span>
              </p>
              <p className="text-sm text-[var(--finova-muted)]">
                Password: <span className="font-medium text-[var(--finova-text)]">admin123</span>
              </p>
            </div>

            <div className="finova-card-soft p-4">
              <p className="text-sm font-semibold text-[var(--finova-text)]">
                Demo viewer
              </p>
              <p className="mt-2 text-sm text-[var(--finova-muted)]">
                Email: <span className="font-medium text-[var(--finova-text)]">viewer@ledgerview.app</span>
              </p>
              <p className="text-sm text-[var(--finova-muted)]">
                Password: <span className="font-medium text-[var(--finova-text)]">viewer123</span>
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-[var(--finova-accent-soft)] p-4">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--finova-accent)] text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--finova-text)]">
                  RBAC simulation
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
                  Viewers can browse reporting pages in read-only mode. Admins
                  get the full workspace, including management pages and editing
                  controls such as transaction updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="finova-card px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {Object.entries(authModes).map(([modeKey, authMode]) => (
              <button
                key={modeKey}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
                  mode === modeKey
                    ? "bg-[var(--finova-accent)] text-white"
                    : "bg-[var(--finova-bg-soft)] text-[var(--finova-muted)] hover:text-[var(--finova-text)]"
                }`}
                type="button"
                onClick={() => {
                  setMode(modeKey);
                  setStatusMessage("");
                }}
              >
                <authMode.icon className="h-4 w-4" />
                {authMode.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--finova-text)] sm:text-3xl">
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
                  placeholder="Jordan Finance"
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
                name="email"
                placeholder="you@ledgerview.app"
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
                name="password"
                placeholder="Minimum 6 characters"
                type="password"
                value={formState.password}
                onChange={handleFieldChange}
              />
            </label>

            {mode === "signUp" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--finova-text)]">
                  Workspace role
                </span>
                <select
                  className="h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)]"
                  name="role"
                  value={formState.role}
                  onChange={handleFieldChange}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            ) : null}

            <div className="min-h-6 text-sm text-[var(--finova-danger)]">
              {statusMessage || null}
            </div>

            <button
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--finova-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-105 sm:w-auto"
              type="submit"
            >
              {activeMode.label}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
