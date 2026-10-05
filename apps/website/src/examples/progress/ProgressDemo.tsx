import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count } from '../shared/format';
import { createPrimesWorker } from './client';

type Status = 'idle' | 'running' | 'done' | 'canceled';

const log = createLog();
const limits = [2_000_000, 8_000_000, 20_000_000] as const;

export function ProgressDemo() {
  const [limit, setLimit] = useState<(typeof limits)[number]>(8_000_000);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState(0);
  const worker = useRef<ReturnType<typeof createPrimesWorker> | null>(null);
  const task = useRef<ReturnType<ReturnType<typeof createPrimesWorker>['countPrimes']> | null>(null);

  useEffect(
    () => () => {
      if (worker.current) void unwrap(worker.current).dispose();
    },
    [],
  );

  const start = () => {
    worker.current ??= createPrimesWorker();

    setStatus('running');
    setProgress(0);
    setFound(0);
    log.write(`countPrimes(${count(limit)}) started`);

    task.current = worker.current.countPrimes(limit).onProgress((percentage, details) => {
      setProgress(percentage);
      setFound((details as { found: number }).found);
    });

    task.current.then(
      (total) => {
        setProgress(100);
        setFound(total);
        setStatus('done');
        log.write(`resolved · ${count(total)} primes below ${count(limit)}`);
      },
      (reason) => {
        setStatus('canceled');
        log.write(`canceled · reason: "${String(reason)}"`);
      },
    );
  };

  const cancel = () => {
    task.current?.cancel('Canceled by user');
  };

  const running = status === 'running';

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Prime search">
        <fieldset className="segmented">
          <legend>Count the primes below</legend>
          {limits.map((value) => (
            <label key={value}>
              <input type="radio" name="primes-limit" checked={limit === value} disabled={running} onChange={() => setLimit(value)} />
              <span>{count(value)}</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button demo-button--primary" onClick={start} disabled={running}>
            {running ? 'Counting…' : 'Start'}
          </button>
          <button type="button" className="demo-button" onClick={cancel} disabled={!running}>
            Cancel
          </button>
        </div>
      </section>

      <section className="demo-card" aria-label="Progress">
        <span>Progress reported by the worker</span>
        <div className="demo-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <dl className="demo-stats">
          <div className={`demo-stat ${status === 'done' ? 'demo-stat--good' : status === 'canceled' ? 'demo-stat--bad' : ''}`}>
            <dt>Status</dt>
            <dd data-testid="primes-status">{status}</dd>
          </div>
          <div className="demo-stat">
            <dt>Primes found</dt>
            <dd data-testid="primes-found">{count(found)}</dd>
          </div>
          <div className="demo-stat">
            <dt>Progress</dt>
            <dd data-testid="primes-progress">{Math.round(progress)}%</dd>
          </div>
        </dl>
        <p className="demo-caption">
          Cancel stops the loop inside the worker. The promise on the main thread rejects with the reason you passed.
        </p>
      </section>
    </div>
  );
}

export const resetProgressDemo = () => {};

export const watchProgressDemo = log.watch;
