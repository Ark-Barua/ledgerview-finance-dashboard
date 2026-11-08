import { BellRing, CalendarDays, PlusCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/calculateStats";

function getEventTone(type) {
  if (type === "income") {
    return "bg-[#e9fbf5] text-[#22b07f]";
  }

  if (type === "expense") {
    return "bg-[#fff1f3] text-[#ea6677]";
  }

  return "bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]";
}

function createEmptyEventDraft() {
  return {
    title: "",
    detail: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: "info",
  };
}

export default function Events() {
  const { createEvent, deleteEvent, role, workspaceEvents } = useFinance();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState(createEmptyEventDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = role === "admin";

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setEventDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await createEvent(eventDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("Event created successfully.");
    setEventDraft(createEmptyEventDraft());
    setIsComposerOpen(false);
  };

  const handleDeleteEvent = async (eventId) => {
    const shouldDelete = window.confirm(
      "Delete this workspace event? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteEvent(eventId);
    if (!deletion.success) return;
    setStatusMessage("Event deleted successfully.");
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Activity events
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              Watch the latest workspace events and operational notifications.
            </p>
          </div>

          {isAdmin ? (
            <button
              className="finova-action-button finova-action-button--primary"
              type="button"
              onClick={() => {
                setStatusMessage("");
                setIsComposerOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Create Event
            </button>
          ) : null}
        </div>

        {isAdmin && isComposerOpen ? (
          <form
            className="finova-card-soft mt-5 grid gap-3 p-4 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Title
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="title"
                placeholder="Event title"
                type="text"
                value={eventDraft.title}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Date
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="date"
                type="date"
                value={eventDraft.date}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Description
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="detail"
                placeholder="Describe the operational event."
                value={eventDraft.detail}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Event type
              </span>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="type"
                value={eventDraft.type}
                onChange={handleDraftChange}
              >
                <option value="info">Info</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Amount
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="amount"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={eventDraft.amount}
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
                    onClick={() => {
                      setIsComposerOpen(false);
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
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="space-y-4">
          {workspaceEvents.length > 0 ? (
            workspaceEvents.map((eventItem) => (
              <article
                key={eventItem.id}
                className="finova-card-soft flex items-start justify-between gap-4 px-4 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
                    <BellRing className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--finova-text)]">
                      {eventItem.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--finova-muted)]">
                      {eventItem.detail}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--finova-muted)]">
                      {formatDate(eventItem.date)} - {eventItem.createdBy}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getEventTone(
                      eventItem.type,
                    )}`}
                  >
                    {eventItem.amount > 0 ? formatCurrency(eventItem.amount) : "Info"}
                  </span>

                  {isAdmin ? (
                    <button
                      className="finova-action-button finova-action-button--danger finova-action-button--sm"
                      type="button"
                      onClick={() => handleDeleteEvent(eventItem.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="finova-card-soft px-4 py-10 text-center text-sm text-[var(--finova-muted)]">
              No workspace events have been created yet.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--finova-accent-soft)] px-4 py-3 text-sm text-[var(--finova-muted)]">
          <CalendarDays className="h-4 w-4 text-[var(--finova-accent)]" />
          Viewers can review the event stream, while admins can create and
          manage operational events.
        </div>
      </section>
    </section>
  );
}
