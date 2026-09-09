import type { Metadata } from "next";
import { AuthForm, AuthLink, AuthShell } from "@/components/AuthForm";
import { requestPasswordResetAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Tell us your email and we'll send a link."
    >
      <AuthForm
        action={requestPasswordResetAction}
        submitLabel="Send reset link"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
        ]}
        footer={
          <p>
            Remembered it? <AuthLink href="/login">Sign in</AuthLink>.
          </p>
        }
      />
    </AuthShell>
  );
}
