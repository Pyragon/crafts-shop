"use client";

/** Browser print, which doubles as "save as PDF" on every platform. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs text-ink-faint underline underline-offset-4 transition-colors hover:text-clay print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
