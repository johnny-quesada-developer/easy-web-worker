import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { megabytes, milliseconds } from '../shared/format';
import { createBufferWorker } from './client';

type Mode = 'copy' | 'transfer';

interface Run {
  mode: Mode;
  elapsed: number;
  /** Size of the buffer the main thread still holds after sending it. */
  kept: number;
  returned: number;
  firstByte: number;
}

const log = createLog();
const sizes = [16, 64, 128] as const;

export function TransferDemo() {
  const [size, setSize] = useState<(typeof sizes)[number]>(64);
  const [running, setRunning] = useState<Mode | null>(null);
  const [runs, setRuns] = useState<Partial<Record<Mode, Run>>>({});
  const worker = useRef<ReturnType<typeof createBufferWorker> | null>(null);

  useEffect(
    () => () => {
      if (worker.current) void unwrap(worker.current).dispose();
    },
    [],
  );

  const send = async (mode: Mode) => {
    worker.current ??= createBufferWorker();

    setRunning(mode);

    const buffer = new ArrayBuffer(size * 1024 * 1024);
    const startedAt = performance.now();

    // the transfer list is the only difference between the two calls
    const result = await (mode === 'transfer' ? worker.current.invert(buffer, [buffer]) : worker.current.invert(buffer));

    const run: Run = {
      mode,
      elapsed: performance.now() - startedAt,
      kept: buffer.byteLength,
      returned: result.byteLength,
      firstByte: new Uint8Array(result)[0],
    };

    setRuns((current) => ({ ...current, [mode]: run }));
    setRunning(null);
    log.write(
      mode === 'transfer'
        ? `transferred · main thread keeps ${megabytes(run.kept)} · ${milliseconds(run.elapsed)}`
        : `copied · main thread keeps ${megabytes(run.kept)} · ${milliseconds(run.elapsed)}`,
    );
  };

  const card = (mode: Mode, title: string) => {
    const run = runs[mode];

    return (
      <section className="demo-card" aria-label={title}>
        <span>{title}</span>
        <dl className="demo-stats">
          <div className={`demo-stat ${run && mode === 'transfer' ? 'demo-stat--good' : ''}`}>
            <dt>Round trip</dt>
            <dd data-testid={`${mode}-elapsed`}>{run ? milliseconds(run.elapsed) : 'not run'}</dd>
          </div>
          <div className="demo-stat">
            <dt>Still in the main thread</dt>
            <dd data-testid={`${mode}-kept`}>{run ? megabytes(run.kept) : 'not run'}</dd>
          </div>
          <div className="demo-stat">
            <dt>Came back</dt>
            <dd data-testid={`${mode}-returned`}>{run ? megabytes(run.returned) : 'not run'}</dd>
          </div>
        </dl>
      </section>
    );
  };

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Buffer">
        <fieldset className="segmented">
          <legend>Buffer size</legend>
          {sizes.map((value) => (
            <label key={value}>
              <input type="radio" name="buffer-size" checked={size === value} disabled={running !== null} onChange={() => { setSize(value); setRuns({}); }} />
              <span>{value} MB</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button" onClick={() => send('copy')} disabled={running !== null}>
            {running === 'copy' ? 'Sending…' : 'Send a copy'}
          </button>
          <button type="button" className="demo-button demo-button--primary" onClick={() => send('transfer')} disabled={running !== null}>
            {running === 'transfer' ? 'Sending…' : 'Transfer it'}
          </button>
        </div>
        <p className="demo-caption">
          The worker inverts every byte and sends the buffer back. A copy duplicates the memory on the way in; a transfer
          moves it, so the sender is left with an empty buffer.
        </p>
      </section>

      <div className="demo-grid demo-grid--stack">
        {card('copy', 'Sent as a copy')}
        {card('transfer', 'Transferred')}
      </div>
    </div>
  );
}

export const resetTransferDemo = () => {};

export const watchTransferDemo = log.watch;
