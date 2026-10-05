export function isPrime(candidate: number): boolean {
  if (candidate < 2) return false;
  if (candidate % 2 === 0) return candidate === 2;

  for (let divisor = 3; divisor * divisor <= candidate; divisor += 2) {
    if (candidate % divisor === 0) return false;
  }

  return true;
}
