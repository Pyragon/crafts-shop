import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full product catalogue, with categories, filtering and search, lands in the next phase.",
};

export default function Page() {
  return (
    <ComingSoon title="Shop" phase="Phase 1">
      <p>The full product catalogue, with categories, filtering and search, lands in the next phase.</p>
    </ComingSoon>
  );
}
