import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ComingSoon title="We couldn't find that page" phase="404">
      <p>
        The link may be old, or the piece may have sold out and been retired.
        Try the shop, or head back home.
      </p>
    </ComingSoon>
  );
}
