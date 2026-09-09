"use client";

type Props = {
  quantity: number;
  max: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
  label: string;
};

/** Minus / value / plus, capped at available stock. */
export function QuantityStepper({
  quantity,
  max,
  disabled,
  onChange,
  label,
}: Props) {
  const btn =
    "grid h-9 w-9 place-items-center text-lg leading-none text-ink transition-colors hover:bg-paper-sunk disabled:cursor-not-allowed disabled:text-ink-faint";

  return (
    <div className="inline-flex items-center rounded-full border border-line-strong">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled}
        aria-label={`Decrease quantity of ${label}`}
        className={`${btn} rounded-l-full`}
      >
        −
      </button>
      <span
        aria-live="polite"
        aria-label={`Quantity of ${label}`}
        className="w-9 text-center text-sm tabular-nums text-ink"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || quantity >= max}
        aria-label={`Increase quantity of ${label}`}
        title={quantity >= max ? `Only ${max} in stock` : undefined}
        className={`${btn} rounded-r-full`}
      >
        +
      </button>
    </div>
  );
}
