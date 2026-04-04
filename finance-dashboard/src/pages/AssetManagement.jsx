import {
  FolderKanban,
  Lock,
  PlusCircle,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFinance } from "../context/FinanceContext";

function createEmptyAssetDraft() {
  return {
    title: "",
    status: "",
    owner: "",
    summary: "",
  };
}

export default function AssetManagement() {
  const {
    assetWorkflows,
    createAssetWorkflow,
    deleteAssetWorkflow,
    role,
    updateAssetWorkflow,
  } = useFinance();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [assetDraft, setAssetDraft] = useState(createEmptyAssetDraft);
  const [statusMessage, setStatusMessage] = useState("");

  const editingAsset = useMemo(() => {
    return assetWorkflows.find((asset) => asset.id === editingAssetId) ?? null;
  }, [assetWorkflows, editingAssetId]);

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
            Asset Management is restricted to admins because it includes
            operational changes and ownership controls.
          </p>
        </div>
      </section>
    );
  }

  const resetEditor = () => {
    setIsCreatorOpen(false);
    setEditingAssetId(null);
    setAssetDraft(createEmptyAssetDraft());
    setStatusMessage("");
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setAssetDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = editingAsset
      ? updateAssetWorkflow(editingAsset.id, assetDraft)
      : createAssetWorkflow(assetDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    resetEditor();
  };

  const handleDeleteWorkflow = (assetId) => {
    const shouldDelete = window.confirm(
      "Delete this asset workflow? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    deleteAssetWorkflow(assetId);

    if (editingAssetId === assetId) {
      resetEditor();
    }
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Asset management
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              Admin-only page for creating, assigning, and updating managed
              asset programs.
            </p>
          </div>

          <button
            className="finova-action-button finova-action-button--primary"
            type="button"
            onClick={() => {
              setAssetDraft(createEmptyAssetDraft());
              setEditingAssetId(null);
              setStatusMessage("");
              setIsCreatorOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            New asset workflow
          </button>
        </div>

        {isCreatorOpen || editingAsset ? (
          <form
            className="finova-card-soft mt-5 grid gap-3 p-4 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Workflow title
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="title"
                placeholder="Treasury allocation"
                type="text"
                value={assetDraft.title}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Status
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="status"
                placeholder="Under review"
                type="text"
                value={assetDraft.status}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Owner
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="owner"
                placeholder="Admin"
                type="text"
                value={assetDraft.owner}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Summary
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="summary"
                placeholder="Describe the workflow and current operational context."
                value={assetDraft.summary}
                onChange={handleDraftChange}
              />
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
                    onClick={resetEditor}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    className="finova-action-button finova-action-button--primary"
                    type="submit"
                  >
                    <Settings2 className="h-4 w-4" />
                    {editingAsset ? "Save Workflow" : "Create Workflow"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {assetWorkflows.map((pipeline) => (
          <article key={pipeline.id} className="finova-card px-5 py-5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
              <FolderKanban className="h-4 w-4" />
            </div>

            <p className="mt-4 text-base font-semibold text-[var(--finova-text)]">
              {pipeline.title}
            </p>
            <p className="mt-2 text-sm text-[var(--finova-muted)]">
              Status: {pipeline.status}
            </p>
            <p className="mt-1 text-sm text-[var(--finova-muted)]">
              Owner: {pipeline.owner}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--finova-muted)]">
              {pipeline.summary}
            </p>

            <div className="finova-action-group mt-5">
              <button
                className="finova-action-button finova-action-button--sm"
                type="button"
                onClick={() => {
                  setAssetDraft({
                    title: pipeline.title,
                    status: pipeline.status,
                    owner: pipeline.owner,
                    summary: pipeline.summary,
                  });
                  setEditingAssetId(pipeline.id);
                  setStatusMessage("");
                }}
              >
                <Settings2 className="h-4 w-4" />
                Manage
              </button>

              <button
                className="finova-action-button finova-action-button--danger finova-action-button--sm"
                type="button"
                onClick={() => handleDeleteWorkflow(pipeline.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
