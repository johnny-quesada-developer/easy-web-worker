import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count, milliseconds } from '../shared/format';
import { createMathWorker } from './client';
import { fibonacci } from './math';
import { useHeartbeat } from './useHeartbeat';

type Mode = 'main' | 'worker';

interface Run {
  mode: Mode;
  result: number;
  elapsed: number;
  frames: number;
  longestGap: number;
}

const log = createLog();
const inputs = [36, 38, 40] as const;

/** A frame that takes longer than this is one the visitor can see. */
const LATE_FRAME = 50;

export function ResponsiveDemo() {
  const [n, setN] = useState<(typeof inputs)[number]>(38);
  const [running, setRunning] = useState<Mode | null>(null);
  const [runs, setRuns] = useState<Partial<Record<Mode, Run>>>({});
  const { heartbeat, start, reset } = useHeartbeat();
  const worker = useRef<ReturnType<typeof createMathWorker> | null>(null);

  useEffect(
    () => () => {
      if (worker.current) void unwrap(worker.current).dispose();
    },
    [],
  );

  const finish = (mode: Mode, result: number, startedAt: number, stop: ReturnType<typeof start>) => {
    const beat = stop();
    const run: Run = { mode, result, elapsed: performance.now() - startedAt, frames: beat.frames, longestGap: beat.longestGap };

    setRuns((current) => ({ ...current, [mode]: run }));
    setRunning(null);

    log.write(
      mode === 'main'
        ? `main thread · fibonacci(${n}) = ${count(result)} · page frozen for ${milliseconds(run.longestGap)}`
        : `worker · fibonacci(${n}) = ${count(result)} · ${run.frames} frames drawn meanwhile`,
    );
  };

  const runOnMainThread = () => {
    setRunning('main');
    const stop = start();

    // two frames, so "Running" is on screen before the thread is blocked
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const startedAt = performance.now();

        finish('main', fibonacci(n), startedAt, stop);
      }),
    );
  };

  const runInWorker = async () => {
    worker.current ??= createMathWorker();

    setRunning('worker');
    const stop = start();
    const startedAt = performance.now();

    finish('worker', await worker.current.fibonacci(n), startedAt, stop);
  };

  const main = runs.main;
  const inWorker = runs.worker;

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Computation">
        <fieldset className="segmented">
          <legend>fibonacci(n), computed the slow way</legend>
          {inputs.map((value) => (
            <label key={value}>
              <input type="radio" name="fibonacci-n" checked={n === value} disabled={running !== null} onChange={() => { setN(value); setRuns({}); reset(); }} />
              <span>n = {value}</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button" onClick={runOnMainThread} disabled={running !== null}>
            {running === 'main' ? 'Running…' : 'Run on the main thread'}
          </button>
          <button type="button" className="demo-button demo-button--primary" onClick={runInWorker} disabled={running !== null}>
            {running === 'worker' ? 'Running…' : 'Run in a Worker'}
          </button>
        </div>
      </section>

      <section className="demo-card" aria-label="Page heartbeat">
        <span>Page heartbeat: one bar per frame drawn</span>
        <div className="demo-pulse" aria-hidden="true">
          {heartbeat.gaps.map((gap, index) => (
            <span className={gap > LATE_FRAME ? 'late' : undefined} style={{ height: `${Math.min(100, Math.max(12, (gap / LATE_FRAME) * 100))}%` }} key={index} />
          ))}
        </div>
        <p className="demo-caption">
          A red bar is a frame that arrived late. While the main thread is busy the page cannot scroll, type or animate.
        </p>
      </section>

      <div className="demo-grid">
        <section className="demo-card" aria-label="Main thread result">
          <span>On the main thread</span>
          <dl className="demo-stats">
            <div className={`demo-stat ${main ? 'demo-stat--bad' : ''}`}>
              <dt>Page frozen</dt>
              <dd data-testid="main-frozen">{main ? milliseconds(main.longestGap) : 'not run'}</dd>
            </div>
            <div className="demo-stat">
              <dt>Result</dt>
              <dd data-testid="main-result">{main ? count(main.result) : 'not run'}</dd>
            </div>
          </dl>
        </section>
        <section className="demo-card" aria-label="Worker result">
          <span>In a Worker</span>
          <dl className="demo-stats">
            <div className={`demo-stat ${inWorker ? 'demo-stat--good' : ''}`}>
              <dt>Frames drawn</dt>
              <dd data-testid="worker-frames">{inWorker ? count(inWorker.frames) : 'not run'}</dd>
            </div>
            <div className="demo-stat">
              <dt>Result</dt>
              <dd data-testid="worker-result">{inWorker ? count(inWorker.result) : 'not run'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

/** Nothing outside the component to restore: the workbench remounts the demo. */
export const resetResponsiveDemo = () => {};

export const watchResponsiveDemo = log.watch;
