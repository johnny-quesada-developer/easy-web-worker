import { unwrap } from 'easy-web-worker/createWorker';
import { math } from './primes-main';

export async function stopEverything() {
  // asks every pending call to cancel, and waits for the worker to confirm
  await unwrap(math).cancelAll('Leaving the page');
}

export async function restart() {
  // terminates the Workers, rejects the pending calls, starts fresh ones
  await unwrap(math).cancelAll('Taking too long', { force: true });
}
