import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to see your orders once accounts are built.",
};

export default function Page() {
  return (
    <ComingSoon title="Account" phase="Phase 3">
      <p>Sign in to see your orders once accounts are built.</p>
    </ComingSoon>
  );
}
