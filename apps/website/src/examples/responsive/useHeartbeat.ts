import { useCallback, useRef, useState } from 'react';

export interface Heartbeat {
  /** Time between consecutive frames while the measurement ran, in milliseconds. */
  gaps: number[];
  frames: number;
  longestGap: number;
}

const empty: Heartbeat = { gaps: [], frames: 0, longestGap: 0 };

/**
 * Counts the frames the main thread manages to draw while some work runs.
 * A blocked main thread draws none, so the gap between two frames is the time the page was frozen.
 */
export function useHeartbeat() {
  const [heartbeat, setHeartbeat] = useState<Heartbeat>(empty);
  const frame = useRef(0);

  const start = useCallback(() => {
    const gaps: number[] = [];
    let last = performance.now();

    const tick = (now: number) => {
      gaps.push(now - last);
      last = now;

      setHeartbeat({ gaps: gaps.slice(-48), frames: gaps.length, longestGap: Math.max(...gaps) });
      frame.current = requestAnimationFrame(tick);
    };

    setHeartbeat(empty);
    frame.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame.current);

      // the frame that was waiting while the thread was blocked
      const gap = performance.now() - last;

      gaps.push(gap);

      const result: Heartbeat = { gaps: gaps.slice(-48), frames: gaps.length, longestGap: Math.max(...gaps) };

      setHeartbeat(result);

      return result;
    };
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setHeartbeat(empty);
  }, []);

  return { heartbeat, start, reset };
}
