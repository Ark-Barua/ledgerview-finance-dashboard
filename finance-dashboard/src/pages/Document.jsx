import { Eye, FileText, PenSquare, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatDate } from "../utils/calculateStats";

function createEmptyDocumentDraft() {
  return {
    title: "",
    summary: "",
    body: "",
  };
}

export default function Document() {
  const { createDocument, deleteDocument, documents, role, updateDocument } = useFinance();
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.id ?? null,
  );
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [documentDraft, setDocumentDraft] = useState(createEmptyDocumentDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = role === "admin";

  const selectedDocument = useMemo(() => {
    return documents.find((documentItem) => documentItem.id === selectedDocumentId) ?? null;
  }, [documents, selectedDocumentId]);

  const editingDocument = useMemo(() => {
    return documents.find((documentItem) => documentItem.id === editingDocumentId) ?? null;
  }, [documents, editingDocumentId]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setDocumentDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = editingDocumentId === "new"
      ? await createDocument(documentDraft)
      : await updateDocument(editingDocument.id, documentDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("Document saved.");
    setSelectedDocumentId(editingDocument?.id ?? result.workspace.documents[0].id);
    setEditingDocumentId(null);
  };

  const handleDeleteDocument = async (documentId) => {
    const shouldDelete = window.confirm(
      "Delete this document? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteDocument(documentId);
    if (!deletion.success) return;
    setStatusMessage("Document deleted successfully.");

    if (selectedDocumentId === documentId) {
      const remainingDocument = documents.find((documentItem) => {
        return documentItem.id !== documentId;
      });
      setSelectedDocumentId(remainingDocument?.id ?? null);
    }

    if (editingDocumentId === documentId) {
      setEditingDocumentId(null);
    }
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <p className="text-lg font-semibold text-[var(--finova-text)]">
          Documents
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
          Centralized document access for runbooks, templates, and written
          finance briefs.
        </p>
        {isAdmin && <button className="finova-action-button mt-4" onClick={() => {
          setEditingDocumentId("new");
          setDocumentDraft(createEmptyDocumentDraft());
          setStatusMessage("");
        }}>Create document</button>}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <section className="space-y-4">
          {documents.map((documentItem) => (
            <article key={documentItem.id} className="finova-card px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-base font-semibold text-[var(--finova-text)]">
                      {documentItem.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
                      {documentItem.summary}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--finova-muted)]">
                      Updated {formatDate(documentItem.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="finova-action-button finova-action-button--sm"
                  type="button"
                  onClick={() => setSelectedDocumentId(documentItem.id)}
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>

                {isAdmin ? (
                  <>
                    <button
                      className="finova-action-button finova-action-button--primary finova-action-button--sm"
                      type="button"
                      onClick={() => {
                        setEditingDocumentId(documentItem.id);
                        setDocumentDraft({
                          title: documentItem.title,
                          summary: documentItem.summary,
                          body: documentItem.body,
                        });
                        setStatusMessage("");
                      }}
                    >
                      <PenSquare className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      className="finova-action-button finova-action-button--danger finova-action-button--sm"
                      type="button"
                      onClick={() => handleDeleteDocument(documentItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="finova-card px-5 py-5 sm:px-6">
          {editingDocument || editingDocumentId === "new" ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-[var(--finova-text)]">
                  {editingDocument ? "Edit document" : "New document"}
                </p>
                <button
                  className="finova-action-button finova-action-button--sm"
                  type="button"
                  onClick={() => {
                    setEditingDocumentId(null);
                    setStatusMessage("");
                  }}
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                  Title
                </span>
                <input
                  className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                  name="title"
                  type="text"
                  value={documentDraft.title}
                  onChange={handleDraftChange}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                  Summary
                </span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                  name="summary"
                  value={documentDraft.summary}
                  onChange={handleDraftChange}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                  Body
                </span>
                <textarea
                  className="min-h-40 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                  name="body"
                  value={documentDraft.body}
                  onChange={handleDraftChange}
                />
              </label>

              <div className="min-h-6 text-sm text-[var(--finova-danger)]">
                {statusMessage || null}
              </div>

              <button
                className="finova-action-button finova-action-button--primary"
                type="submit"
              >
                <PenSquare className="h-4 w-4" />
                Save changes
              </button>
            </form>
          ) : selectedDocument ? (
            <div>
              <p className="text-lg font-semibold text-[var(--finova-text)]">
                Document preview
              </p>
              <p className="mt-2 text-sm text-[var(--finova-muted)]">
                {selectedDocument.title}
              </p>
              <div className="finova-card-soft mt-5 px-4 py-4">
                <p className="text-sm font-semibold text-[var(--finova-text)]">
                  {selectedDocument.summary}
                </p>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--finova-muted)]">
                  {selectedDocument.body}
                </p>
              </div>
            </div>
          ) : (
            <div className="finova-card-soft px-4 py-10 text-center text-sm text-[var(--finova-muted)]">
              {documents.length ? "Select a document to preview it here." : "No documents yet."}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
