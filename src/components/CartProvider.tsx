"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import type { CartSummary, PersonalisationInput } from "@/lib/cart";
import {
  addToCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";

type CartContextValue = {
  cart: CartSummary;
  isOpen: boolean;
  isPending: boolean;
  error: string | null;
  open: () => void;
  close: () => void;
  add: (
    variantId: string,
    quantity?: number,
    personalisation?: PersonalisationInput,
  ) => void;
  update: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: CartSummary;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState(initialCart);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Quantity changes feel instant; the server's answer replaces this the
  // moment it lands, so a stock clamp still wins.
  const [optimisticCart, applyOptimistic] = useOptimistic(
    cart,
    (state: CartSummary, next: CartSummary) => next,
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const run = useCallback(
    (
      action: () => Promise<{ ok: boolean; error?: string; cart: CartSummary }>,
      optimistic?: CartSummary,
    ) => {
      setError(null);
      startTransition(async () => {
        if (optimistic) applyOptimistic(optimistic);
        const result = await action();
        setCart(result.cart);
        if (!result.ok && result.error) setError(result.error);
      });
    },
    [applyOptimistic],
  );

  const add = useCallback(
    (
      variantId: string,
      quantity = 1,
      personalisation?: PersonalisationInput,
    ) => {
      setIsOpen(true);
      run(() => addToCartAction(variantId, quantity, personalisation));
    },
    [run],
  );

  const recalculate = useCallback(
    (lines: CartSummary["lines"]): CartSummary => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.lineTotalCents, 0),
    }),
    [],
  );

  const update = useCallback(
    (itemId: string, quantity: number) => {
      const lines = cart.lines
        .map((l) =>
          l.id === itemId
            ? {
                ...l,
                quantity,
                lineTotalCents: l.unitPriceCents * quantity,
              }
            : l,
        )
        .filter((l) => l.quantity > 0);
      run(() => updateCartItemAction(itemId, quantity), recalculate(lines));
    },
    [cart.lines, recalculate, run],
  );

  const remove = useCallback(
    (itemId: string) => {
      const lines = cart.lines.filter((l) => l.id !== itemId);
      run(() => removeCartItemAction(itemId), recalculate(lines));
    },
    [cart.lines, recalculate, run],
  );

  const value = useMemo(
    () => ({
      cart: optimisticCart,
      isOpen,
      isPending,
      error,
      open,
      close,
      add,
      update,
      remove,
    }),
    [optimisticCart, isOpen, isPending, error, open, close, add, update, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
