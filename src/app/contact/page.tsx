import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Contact",
  description: "A contact form is coming; for now, email is the fastest route.",
};

export default function Page() {
  return (
    <ComingSoon title="Contact" phase="Phase 0">
      <p>A contact form is coming; for now, email is the fastest route.</p>
    </ComingSoon>
  );
}
