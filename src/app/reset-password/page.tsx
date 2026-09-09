import type { Metadata } from "next";
import { AuthForm, AuthLink, AuthShell } from "@/components/AuthForm";
import { resetPasswordAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = (await searchParams) as { token?: string };

  if (!token) {
    return (
      <AuthShell title="Choose a new password">
        <p className="text-sm text-ink-soft">
          This page needs the link from your email.{" "}
          <AuthLink href="/forgot-password">Request a new one</AuthLink>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      intro="Signing in everywhere else will be ended, just in case."
    >
      <AuthForm
        action={resetPasswordAction}
        hidden={{ token }}
        submitLabel="Set new password"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            help: "At least 10 characters.",
          },
          {
            name: "confirm",
            label: "Confirm password",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
    </AuthShell>
  );
}
