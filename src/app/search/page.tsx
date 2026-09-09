import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Search",
  description: "Product search arrives with the catalogue.",
};

export default function Page() {
  return (
    <ComingSoon title="Search" phase="Phase 1">
      <p>Product search arrives with the catalogue.</p>
    </ComingSoon>
  );
}
