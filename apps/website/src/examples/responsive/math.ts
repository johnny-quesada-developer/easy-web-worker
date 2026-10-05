/** Deliberately slow: each extra unit of `n` roughly multiplies the work by 1.6. */
export function fibonacci(n: number): number {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}
