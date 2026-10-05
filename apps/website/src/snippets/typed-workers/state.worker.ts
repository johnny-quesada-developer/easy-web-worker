import { defineWorker } from 'easy-web-worker/defineWorker';

type User = { id: string; name: string };

// module scope of the worker: it lives as long as the worker does
const users = new Map<string, User>();

const worker = defineWorker(() => ({
  save: (user: User) => {
    users.set(user.id, user);
  },

  get: (id: string) => users.get(id) ?? null,

  remove: (id: string) => users.delete(id),
}));

export type UsersWorker = typeof worker;
