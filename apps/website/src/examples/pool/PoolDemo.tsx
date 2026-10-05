import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count, milliseconds } from '../shared/format';
import { createCollatzWorker } from './client';
import { segments, type Chain } from './collatz';

type Size = 1 | 3;

interface Segment {
  from: number;
  to: number;
  worker: string | null;
  /** Percentage of the segment searched so far, reported by the worker. */
  progress: number;
  chain: Chain | null;
}

const log = createLog();
const limits = [1_500_000, 4_500_000, 9_000_000] as const;

const SEGMENTS = 3;

const idleSegments = (limit: number): Segment[] => segments(limit, SEGMENTS).map(([from, to]) => ({ from, to, worker: null, progress: 0, chain: null }));

export function PoolDemo() {
  const [limit, setLimit] = useState<(typeof limits)[number]>(4_500_000);
  const [running, setRunning] = useState<Size | null>(null);
  const [parts, setParts] = useState<Segment[]>(() => idleSegments(4_500_000));
  const [elapsed, setElapsed] = useState<Partial<Record<Size, number>>>({});
  const pools = useRef(new Map<Size, ReturnType<typeof createCollatzWorker>>());

  useEffect(
    () => () => {
      pools.current.forEach((pool) => void unwrap(pool).dispose());
    },
    [],
  );

  const run = async (size: Size) => {
    const pool = pools.current.get(size) ?? createCollatzWorker(size);

    pools.current.set(size, pool);
    setRunning(size);
    setParts(idleSegments(limit));

    const startedAt = performance.now();
    const update = (index: number, changes: Partial<Segment>) =>
      setParts((current) => current.map((part, position) => (position === index ? { ...part, ...changes } : part)));

    // the calling code is the same for one worker or three
    const results = await Promise.all(
      segments(limit, SEGMENTS).map(([from, to], index) =>
        pool
          .longestChain([from, to])
          .onProgress((progress, details) => update(index, { progress, worker: (details as { worker: string }).worker }))
          .then(({ worker, ...chain }) => {
            update(index, { worker, progress: 100, chain });

            return worker;
          }),
      ),
    );

    const total = performance.now() - startedAt;

    setElapsed((current) => ({ ...current, [size]: total }));
    setRunning(null);
    log.write(`${SEGMENTS} segments · ${new Set(results).size} worker${size === 1 ? '' : 's'} used · ${milliseconds(total)}`);
  };

  const one = elapsed[1];
  const three = elapsed[3];

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Search">
        <fieldset className="segmented">
          <legend>Longest Collatz chain below</legend>
          {limits.map((value) => (
            <label key={value}>
              <input type="radio" name="collatz-limit" checked={limit === value} disabled={running !== null} onChange={() => { setLimit(value); setParts(idleSegments(value)); setElapsed({}); }} />
              <span>{count(value)}</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button" onClick={() => run(1)} disabled={running !== null}>
            {running === 1 ? 'Running…' : 'Run with 1 worker'}
          </button>
          <button type="button" className="demo-button demo-button--primary" onClick={() => run(3)} disabled={running !== null}>
            {running === 3 ? 'Running…' : 'Run with 3 workers'}
          </button>
        </div>
      </section>

      <section className="demo-card" aria-label="Segments">
        <span>Three segments, three different answers</span>
        <ul className="demo-lanes">
          {parts.map((part, index) => (
            <li className={`demo-lane demo-lane--result ${part.chain ? 'demo-lane--done' : ''}`} key={part.from}>
              <span>
                {count(part.from)} to {count(part.to)}
              </span>
              <div className="demo-progress">
                <span style={{ width: `${part.progress}%` }} />
              </div>
              <span data-testid={`segment-${index + 1}`}>
                {part.chain ? `${count(part.chain.start)} · ${part.chain.steps} steps` : running === null ? 'not run' : part.progress > 0 ? `${Math.round(part.progress)}%` : 'waiting'}
              </span>
              <span data-testid={`segment-worker-${index + 1}`}>{part.worker ?? ''}</span>
            </li>
          ))}
        </ul>
        <dl className="demo-stats">
          <div className={`demo-stat ${one !== undefined ? 'demo-stat--bad' : ''}`}>
            <dt>1 worker · one after another</dt>
            <dd data-testid="pool-elapsed-1">{one === undefined ? 'not run' : milliseconds(one)}</dd>
          </div>
          <div className={`demo-stat ${three !== undefined ? 'demo-stat--good' : ''}`}>
            <dt>3 workers · at the same time</dt>
            <dd data-testid="pool-elapsed-3">{three === undefined ? 'not run' : milliseconds(three)}</dd>
          </div>
        </dl>
        <p className="demo-caption" data-testid="pool-speedup">
          {one !== undefined && three !== undefined
            ? `Same answers, ${(one / three).toFixed(1)}× faster. The only change is maxWorkers.`
            : 'Run it both ways. The answers are the same; the only change in the code is maxWorkers.'}
        </p>
      </section>
    </div>
  );
}

export const resetPoolDemo = () => {};

export const watchPoolDemo = log.watch;
