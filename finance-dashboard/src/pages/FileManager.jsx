import { Download, FolderOpen, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatDate } from "../utils/calculateStats";
import { downloadTextFile } from "../utils/downloadFile";

function createEmptyFileDraft() {
  return {
    name: "",
    content: "",
  };
}

export default function FileManager() {
  const { deleteWorkspaceFile, role, uploadWorkspaceFile, workspaceFiles } =
    useFinance();
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [fileDraft, setFileDraft] = useState(createEmptyFileDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = role === "admin";

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setFileDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await uploadWorkspaceFile(fileDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("File uploaded to workspace storage.");
    setFileDraft(createEmptyFileDraft());
    setIsUploaderOpen(false);
  };

  const handleDeleteFile = async (fileId) => {
    const shouldDelete = window.confirm(
      "Delete this stored file? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteWorkspaceFile(fileId);
    if (!deletion.success) return;
    setStatusMessage("File deleted from workspace storage.");
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              File manager
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              Browse workspace exports and shared financial files.
            </p>
          </div>

          {isAdmin ? (
            <button
              className="finova-action-button finova-action-button--primary w-full sm:w-auto"
              type="button"
              onClick={() => {
                setStatusMessage("");
                setIsUploaderOpen(true);
              }}
            >
              <Upload className="h-4 w-4" />
              Upload file
            </button>
          ) : null}
        </div>

        {isAdmin && isUploaderOpen ? (
          <form
            className="finova-card-soft mt-5 grid gap-3 p-4"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                File name
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="name"
                placeholder="File name"
                type="text"
                value={fileDraft.name}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                File content
              </span>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="content"
                placeholder="Paste or write the file content that should be stored."
                value={fileDraft.content}
                onChange={handleDraftChange}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6 text-sm text-[var(--finova-danger)]">
                {statusMessage || null}
              </div>

              <div className="finova-action-group">
                <button
                  className="finova-action-button"
                  type="button"
                  onClick={() => {
                    setIsUploaderOpen(false);
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
                  <Upload className="h-4 w-4" />
                  Save File
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="space-y-3">
          {workspaceFiles.map((fileItem) => (
            <article
              key={fileItem.id}
              className="finova-card-soft flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
                  <FolderOpen className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--finova-text)]">
                    {fileItem.name}
                  </p>
                  <div className="mt-1 space-y-1 text-sm text-[var(--finova-muted)]">
                    <p className="break-words">{fileItem.owner}</p>
                    <p>
                      {fileItem.size} • {formatDate(fileItem.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="finova-action-group w-full justify-start sm:w-auto sm:shrink-0 sm:justify-end">
                <button
                  className="finova-action-button finova-action-button--sm min-w-0 flex-1 sm:flex-none"
                  type="button"
                  onClick={() => downloadTextFile(fileItem.name, fileItem.content)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>

                {isAdmin ? (
                  <button
                    className="finova-action-button finova-action-button--danger finova-action-button--sm min-w-0 flex-1 sm:flex-none"
                    type="button"
                    onClick={() => handleDeleteFile(fileItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
