import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { count } from '../shared/format';
import { createTextWorker, type TextAnalysis, type TextWorker } from './textWorker';

const log = createLog();

const sample =
  'Web Workers move expensive work away from the main thread. The page keeps scrolling while the worker works, and the worker answers when the work is done.';

export function RuntimeDemo() {
  const [text, setText] = useState(sample);
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const worker = useRef<TextWorker | null>(null);

  useEffect(() => {
    worker.current ??= createTextWorker();

    const task = worker.current.analyze(text);

    task.then(
      (result) => {
        setAnalysis(result);
        log.write(`analyze(text) resolved · ${count(result.words)} words · ${count(result.unique)} unique`);
      },
      () => {
        // a newer text replaced this call
      },
    );

    // typing again cancels the call that is still running
    return () => {
      task.cancel('Superseded by a newer text');
    };
  }, [text]);

  useEffect(
    () => () => {
      if (worker.current) void unwrap(worker.current).dispose();
      worker.current = null;
    },
    [],
  );

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Text">
        <label>
          Type or paste some text
          <textarea rows={5} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <p className="demo-caption">Every change is analyzed inside a worker that was created from a function, with no worker file.</p>
      </section>

      <section className="demo-card" aria-label="Analysis">
        <span>Computed in the worker</span>
        <dl className="demo-stats">
          <div className="demo-stat demo-stat--good">
            <dt>Words</dt>
            <dd data-testid="text-words">{analysis ? count(analysis.words) : '…'}</dd>
          </div>
          <div className="demo-stat">
            <dt>Unique</dt>
            <dd data-testid="text-unique">{analysis ? count(analysis.unique) : '…'}</dd>
          </div>
          <div className="demo-stat">
            <dt>Reading time</dt>
            <dd>{analysis ? `${analysis.readingSeconds} s` : '…'}</dd>
          </div>
        </dl>
        <pre className="demo-json" data-testid="text-frequent">
          {analysis ? analysis.frequent.map(({ word, times }) => `${word} × ${times}`).join('\n') || 'No repeated words yet.' : '…'}
        </pre>
      </section>
    </div>
  );
}

export const resetRuntimeDemo = () => {};

export const watchRuntimeDemo = log.watch;
