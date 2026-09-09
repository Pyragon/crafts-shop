import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm, AuthLink, AuthShell } from "@/components/AuthForm";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/account");
  const params = (await searchParams) as { next?: string };

  return (
    <AuthShell title="Sign in" intro="Your cart comes with you.">
      <AuthForm
        action={loginAction}
        hidden={params.next ? { next: params.next } : {}}
        submitLabel="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <div className="space-y-2">
            <p>
              <AuthLink href="/forgot-password">Forgotten your password?</AuthLink>
            </p>
            <p>
              No account yet? <AuthLink href="/register">Create one</AuthLink>.
            </p>
          </div>
        }
      />
    </AuthShell>
  );
}
