const fibonacci = (n) => (n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2));

self.onmessage = ({ data: { id, n } }) => {
  self.postMessage({ id, result: fibonacci(n) });
};
