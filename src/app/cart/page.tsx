import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your basket will live here once the catalogue exists to fill it.",
};

export default function Page() {
  return (
    <ComingSoon title="Cart" phase="Phase 2">
      <p>Your basket will live here once the catalogue exists to fill it.</p>
    </ComingSoon>
  );
}
