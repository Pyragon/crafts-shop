import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind the studio is still being written.",
};

export default function Page() {
  return (
    <ComingSoon title="About" phase="Phase 0">
      <p>The story behind the studio is still being written.</p>
    </ComingSoon>
  );
}
