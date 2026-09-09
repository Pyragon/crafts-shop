"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  destroySession,
  getCurrentUser,
  issueToken,
  loginUser,
  registerUser,
  resetPassword,
  sendVerificationEmail,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export type FormState = { error?: string; notice?: string };

/** Only allow redirects to our own paths — never to an attacker's URL. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const result = await loginUser(email, password);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  const result = await registerUser(email, password, name);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Always the same answer, whether or not the account exists — otherwise this
  // form tells anyone which emails are registered.
  if (user) {
    const token = await issueToken(user.id, "PASSWORD_RESET");
    await sendPasswordResetEmail(user.email, user.name, token);
  }

  return {
    notice:
      "If that email has an account, a reset link is on its way. The link is good for one hour.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) return { error: "Those passwords don't match." };

  const result = await resetPassword(token, password);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const name = String(formData.get("name") ?? "").trim();
  await db.user.update({
    where: { id: user.id },
    data: { name: name || null },
  });

  revalidatePath("/account");
  return { notice: "Saved." };
}

export async function resendVerificationAction(
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };
  if (user.emailVerified) return { notice: "That address is already confirmed." };

  await sendVerificationEmail(user.id, user.email, user.name);
  return { notice: "Sent — check your email. The link is good for 48 hours." };
}
