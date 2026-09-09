"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

type Field = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  help?: string;
  defaultValue?: string;
};

/**
 * Shared shell for the auth forms.
 *
 * A plain <form> with a server action, so it submits and shows errors with
 * JavaScript disabled — sign-in is not somewhere to require JS.
 */
export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden = {},
  footer,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  hidden?: Record<string, string>;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-clay-tint px-4 py-3 text-sm text-clay"
        >
          {state.error}
        </p>
      )}
      {state.notice && (
        <p
          role="status"
          className="rounded-xl bg-sage-tint px-4 py-3 text-sm text-sage"
        >
          {state.notice}
        </p>
      )}

      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            required={field.required !== false}
            autoComplete={field.autoComplete}
            defaultValue={field.defaultValue}
            className="mt-2 w-full appearance-none rounded-lg border border-line-strong bg-paper-raised px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-clay"
          />
          {field.help && (
            <p className="mt-1.5 text-xs text-ink-faint">{field.help}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-clay px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint"
      >
        {pending ? "Just a moment…" : submitLabel}
      </button>

      {footer && <div className="pt-2 text-sm text-ink-soft">{footer}</div>}
    </form>
  );
}

export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:py-20">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      {intro && (
        <p className="mt-3 text-base leading-relaxed text-ink-soft">{intro}</p>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-clay underline underline-offset-4 hover:text-clay-dark">
      {children}
    </Link>
  );
}
