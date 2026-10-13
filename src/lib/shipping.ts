import type { Address } from '../types/checkout-types';

/**
 * Shipping is free for now. When you decide on rates, change only this
 * function (e.g. by province, by weight, or free above a subtotal).
 * The cart, checkout and saved orders all use it.
 */
export function calculateShipping(_subtotal: number, _address?: Address | null) {
  return 0;
}