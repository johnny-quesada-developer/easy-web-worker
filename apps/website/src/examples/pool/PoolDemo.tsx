import { useEffect, useRef, useState } from 'react';
import { unwrap } from 'easy-web-worker/createWorker';
import '../shared/demo.css';
import { createLog } from '../shared/log';
import { milliseconds } from '../shared/format';
import { createCrunchWorker } from './client';

const log = createLog();
const sizes = [1, 2, 4] as const;

const TASKS = 8;
const TASK_TIME = 250;

interface Task {
  id: number;
  worker: string | null;
  finishedAt: number | null;
}

const idleTasks = (): Task[] => new Array(TASKS).fill(null).map((_, id) => ({ id, worker: null, finishedAt: null }));

export function PoolDemo() {
  const [size, setSize] = useState<(typeof sizes)[number]>(4);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(idleTasks);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const pools = useRef(new Map<number, ReturnType<typeof createCrunchWorker>>());

  useEffect(
    () => () => {
      pools.current.forEach((pool) => void unwrap(pool).dispose());
    },
    [],
  );

  const run = async () => {
    const pool = pools.current.get(size) ?? createCrunchWorker(size);

    pools.current.set(size, pool);
    setRunning(true);
    setElapsed(null);
    setTasks(idleTasks());

    const startedAt = performance.now();

    // the calling code is the same for one worker or four
    const workers = await Promise.all(
      idleTasks().map(({ id }) =>
        pool.crunch(TASK_TIME).then((worker) => {
          const finishedAt = performance.now() - startedAt;

          setTasks((current) => current.map((task) => (task.id === id ? { id, worker, finishedAt } : task)));

          return worker;
        }),
      ),
    );

    const total = performance.now() - startedAt;

    setElapsed(total);
    setRunning(false);
    log.write(`${TASKS} tasks · ${new Set(workers).size} worker${size === 1 ? '' : 's'} used · ${milliseconds(total)}`);
  };

  const sequential = TASKS * TASK_TIME;

  return (
    <div className="demo">
      <section className="demo-card" aria-label="Pool size">
        <fieldset className="segmented">
          <legend>maxWorkers</legend>
          {sizes.map((value) => (
            <label key={value}>
              <input type="radio" name="pool-size" checked={size === value} disabled={running} onChange={() => { setSize(value); setTasks(idleTasks()); setElapsed(null); }} />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
        <div className="demo-actions">
          <button type="button" className="demo-button demo-button--primary" onClick={run} disabled={running}>
            {running ? 'Running…' : `Run ${TASKS} tasks of ${TASK_TIME} ms`}
          </button>
        </div>
      </section>

      <section className="demo-card" aria-label="Tasks">
        <span>Who did each task</span>
        <ul className="demo-lanes">
          {tasks.map((task) => (
            <li className={`demo-lane ${task.worker ? 'demo-lane--done' : ''}`} key={task.id}>
              <span>task {task.id + 1}</span>
              <div className="demo-progress">
                <span style={{ width: task.worker ? '100%' : '0%' }} />
              </div>
              <span data-testid={`task-${task.id + 1}`}>{task.worker ?? 'waiting'}</span>
            </li>
          ))}
        </ul>
        <dl className="demo-stats">
          <div className={`demo-stat ${elapsed !== null ? 'demo-stat--good' : ''}`}>
            <dt>Total time</dt>
            <dd data-testid="pool-elapsed">{elapsed === null ? 'not run' : milliseconds(elapsed)}</dd>
          </div>
          <div className="demo-stat">
            <dt>One after another</dt>
            <dd>{milliseconds(sequential)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export const resetPoolDemo = () => {};

export const watchPoolDemo = log.watch;
