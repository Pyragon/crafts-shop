"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/app/actions/auth";
import type { FormState } from "@/app/actions/auth";

/**
 * Nag, never a wall.
 *
 * An unverified address does not block buying — checkout allows guests too, so
 * blocking a registered customer while letting strangers through would make no
 * sense, and would quietly cost sales whenever an email lands in spam.
 */
export function VerifyBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resendVerificationAction,
    {},
  );

  return (
    <div className="mt-8 rounded-xl border border-line bg-clay-tint px-5 py-4">
      <p className="text-sm text-ink">
        <span className="font-medium">Confirm your email.</span> We sent a link
        to {email}. It is not required to order — it just means we can reach you
        about one.
      </p>
      <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-clay px-5 py-2 text-sm text-clay transition-colors hover:bg-paper-raised disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send it again"}
        </button>
        {state.notice && (
          <span role="status" className="text-sm text-sage">
            {state.notice}
          </span>
        )}
        {state.error && (
          <span role="alert" className="text-sm text-clay">
            {state.error}
          </span>
        )}
      </form>
    </div>
  );
}
