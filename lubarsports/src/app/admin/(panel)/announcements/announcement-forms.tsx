"use client";

import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/app/admin/actions/announcements";
import { ActionForm, ConfirmAction, FieldError, SubmitButton } from "@/components/admin/form-bits";

export type AnnouncementRow = {
  id: number;
  title: string;
  body: string;
  tone: string;
  pinned: boolean;
  expiresAt: string | null;
};

function Fields({ a, errors, idPrefix }: { a?: AnnouncementRow; errors?: Record<string, string>; idPrefix: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_10rem_11rem]">
      <div className="sm:col-span-3">
        <label className="label" htmlFor={`${idPrefix}-title`}>
          Title
        </label>
        <input id={`${idPrefix}-title`} name="title" defaultValue={a?.title} maxLength={120} required className="input" aria-invalid={Boolean(errors?.title)} placeholder="Week 5 moved to Wednesday" />
        <FieldError message={errors?.title} />
      </div>
      <div className="sm:col-span-3">
        <label className="label" htmlFor={`${idPrefix}-body`}>
          Message
        </label>
        <textarea id={`${idPrefix}-body`} name="body" defaultValue={a?.body} rows={3} maxLength={2000} required className="input" aria-invalid={Boolean(errors?.body)} />
        <FieldError message={errors?.body} />
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-tone`}>
          Style
        </label>
        <select id={`${idPrefix}-tone`} name="tone" defaultValue={a?.tone ?? "info"} className="input select">
          <option value="info">News (red)</option>
          <option value="success">Good news (green)</option>
          <option value="warning">Change or warning (amber)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-expires`}>
          Hide after <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id={`${idPrefix}-expires`} name="expiresAt" type="date" defaultValue={a?.expiresAt ?? ""} className="input" aria-invalid={Boolean(errors?.expiresAt)} />
        <FieldError message={errors?.expiresAt} />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-[0.9375rem]">
        <input type="checkbox" name="pinned" defaultChecked={a?.pinned} className="size-4 accent-[var(--cloth)]" />
        Pin to the top
      </label>
    </div>
  );
}

export function NewAnnouncementForm() {
  return (
    <ActionForm action={createAnnouncement} resetOnSuccess className="space-y-3">
      {(state) => (
        <>
          <Fields errors={state.errors} idPrefix="new" />
          <SubmitButton pendingLabel="Posting…">Post to homepage</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function EditAnnouncement({ a }: { a: AnnouncementRow }) {
  return (
    <div className="space-y-3">
      <ActionForm action={updateAnnouncement} className="space-y-3">
        {(state) => (
          <>
            <input type="hidden" name="id" value={a.id} />
            <Fields a={a} errors={state.errors} idPrefix={`a${a.id}`} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton className="btn btn-sm btn-primary">Save</SubmitButton>
            </div>
          </>
        )}
      </ActionForm>
      <ConfirmAction
        action={deleteAnnouncement}
        fields={{ id: String(a.id) }}
        trigger="Delete announcement"
        triggerClassName="btn btn-sm btn-quiet text-loss"
        title={`Delete “${a.title}”?`}
        confirmLabel="Delete"
      >
        It&apos;s removed from the homepage straight away.
      </ConfirmAction>
    </div>
  );
}
