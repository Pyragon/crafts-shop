import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Journal",
  description: "Studio notes and how-to posts will live here.",
};

export default function Page() {
  return (
    <ComingSoon title="Journal" phase="Phase 5">
      <p>Studio notes and how-to posts will live here.</p>
    </ComingSoon>
  );
}
