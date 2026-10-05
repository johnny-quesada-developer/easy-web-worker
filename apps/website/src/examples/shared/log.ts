type Listener = (line: string) => void;

/**
 * The status line under each example: the demo writes what just happened, the workbench shows it.
 */
export function createLog() {
  const listeners = new Set<Listener>();

  return {
    write(line: string) {
      listeners.forEach((listener) => listener(line));
    },
    watch(listener: Listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
