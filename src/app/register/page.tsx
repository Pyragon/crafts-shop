import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm, AuthLink, AuthShell } from "@/components/AuthForm";
import { registerAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/account");
  const params = (await searchParams) as { next?: string };

  return (
    <AuthShell
      title="Create an account"
      intro="So you can follow an order without digging through your email."
    >
      <AuthForm
        action={registerAction}
        hidden={params.next ? { next: params.next } : {}}
        submitLabel="Create account"
        fields={[
          {
            name: "name",
            label: "Name",
            type: "text",
            autoComplete: "name",
            required: false,
            help: "Optional — it's just what we'll call you.",
          },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            help: "At least 10 characters. Length beats punctuation.",
          },
        ]}
        footer={
          <p>
            Already have an account? <AuthLink href="/login">Sign in</AuthLink>.
          </p>
        }
      />
    </AuthShell>
  );
}
