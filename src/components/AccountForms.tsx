"use client";

import { useActionState } from "react";
import { logoutAction, updateProfileAction } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-ink transition-colors hover:bg-paper-sunk"
      >
        Sign out
      </button>
    </form>
  );
}

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultName}
          autoComplete="name"
          className="mt-2 w-full appearance-none rounded-lg border border-line-strong bg-paper-raised px-4 py-3 text-sm text-ink outline-none focus:border-clay"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-clay">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="text-sm text-sage">
          {state.notice}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-clay disabled:bg-line-strong disabled:text-ink-faint"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
