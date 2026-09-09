"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  removeCartItem,
  updateCartItem,
  type CartMutationResult,
} from "@/lib/cart";

/**
 * Server actions are the only way the cart is mutated. Quantities and prices
 * are never trusted from the client — the client sends an id and a desired
 * quantity, and the server decides what actually happens against live stock.
 */

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<CartMutationResult> {
  const result = await addToCart(productId, quantity);
  revalidatePath("/cart");
  return result;
}

export async function updateCartItemAction(
  itemId: string,
  quantity: number,
): Promise<CartMutationResult> {
  const result = await updateCartItem(itemId, quantity);
  revalidatePath("/cart");
  return result;
}

export async function removeCartItemAction(
  itemId: string,
): Promise<CartMutationResult> {
  const result = await removeCartItem(itemId);
  revalidatePath("/cart");
  return result;
}
