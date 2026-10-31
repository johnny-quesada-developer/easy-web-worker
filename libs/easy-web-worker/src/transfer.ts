import type { TransferResult } from './types';

/**
 * Key that marks the values created by transfer.
 * It is a registered symbol, so it is the same even if the package is loaded more than once (esm and cjs).
 */
export const transferResult$: unique symbol = Symbol.for(
  'easy-web-worker/transfer'
);

/**
 * Returns a result from a worker method and transfers the given objects instead of copying them.
 * The call on the main thread resolves with the result itself, and its type is the type of the result.
 *
 * @example
 * const worker = defineWorker(({ transfer }) => ({
 *   invert: (pixels: ArrayBuffer) => {
 *     const bytes = new Uint8Array(pixels).map((value) => 255 - value);
 *
 *     return transfer(bytes.buffer, [bytes.buffer]);
 *   },
 * }));
 *
 * // main thread: Promise<ArrayBuffer>
 * const inverted = await images.invert(pixels, [pixels]);
 */
export const transfer = <TResult>(
  result: TResult,
  transferList: Transferable[]
): TransferResult<TResult> => ({
  [transferResult$]: true,
  result,
  transferList,
});

/**
 * Internal: tells whether a value returned by a method was created by transfer
 */
export const isTransferResult = (
  value: unknown
): value is TransferResult<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  (value as Partial<TransferResult<unknown>>)[transferResult$] === true;

export default transfer;
